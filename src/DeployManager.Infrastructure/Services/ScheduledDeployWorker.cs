using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.Features.Deploy.Commands;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Infrastructure.Services;

public class ScheduledDeployWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ScheduledDeployWorker> _logger;

    public ScheduledDeployWorker(IServiceScopeFactory scopeFactory, ILogger<ScheduledDeployWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ScheduledDeployWorker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in ScheduledDeployWorker tick.");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }

        _logger.LogInformation("ScheduledDeployWorker stopped.");
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        List<ScheduledDeploy> pending;
        using (var scope = _scopeFactory.CreateScope())
        {
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var allScheduled = await unitOfWork.Repository<ScheduledDeploy>().GetAllAsync(ct);
            var now = DateTime.UtcNow;
            pending = allScheduled
                .Where(s => s.Status == ScheduledDeployStatus.Pending && s.ScheduledAt <= now)
                .ToList();
        }

        foreach (var scheduled in pending)
        {
            await ProcessScheduledDeployAsync(scheduled, ct);
        }
    }

    private async Task ProcessScheduledDeployAsync(ScheduledDeploy scheduled, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var mediator = scope.ServiceProvider.GetRequiredService<MediatR.ISender>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var site = await unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(scheduled.SiteId, ct);
        var siteName = site?.Name ?? "Unknown";
        var recipients = JsonSerializer.Deserialize<List<string>>(scheduled.Recipients) ?? new();
        var package = scheduled.PackageId.HasValue
            ? await unitOfWork.Repository<DeployPackage>().GetByIdAsync(scheduled.PackageId.Value, ct)
            : null;
        var packageFileName = package?.FileName ?? "Unknown";

        _logger.LogInformation("Triggering scheduled deploy {Id} '{Name}' for site '{Site}'",
            scheduled.Id, scheduled.Name, siteName);

        scheduled.Status = ScheduledDeployStatus.Executing;
        scheduled.StartedAt = DateTime.UtcNow;
        await unitOfWork.Repository<ScheduledDeploy>().UpdateAsync(scheduled, ct);
        await unitOfWork.SaveChangesAsync(ct);

        try
        {
            if (!scheduled.PackageId.HasValue)
                throw new InvalidOperationException("No package associated with the scheduled deploy.");

            if (site is null)
                throw new InvalidOperationException("Site not found for deployment.");

            var targets = scope.ServiceProvider.GetRequiredService<IEnumerable<IDeployTarget>>();
            var target = targets.FirstOrDefault(t => t.TargetType == site.TargetType);
            if (target is null)
                throw new InvalidOperationException($"No deploy target for {site.TargetType}.");

            if (scheduled.NotifyOnStart)
            {
                var user = await unitOfWork.Repository<User>()
                    .GetByIdAsync(scheduled.CreatedByUserId, ct);
                await emailService.SendDeployStartNotificationAsync(
                    siteName, packageFileName, recipients, user?.Username ?? "Scheduled", ct);
            }

            var jobId = await mediator.Send(new ConfirmDeployCommand
            {
                PackageId = scheduled.PackageId!.Value,
            }, ct);

            scheduled.JobId = jobId;
            scheduled.ErrorMessage = null;
            await unitOfWork.Repository<ScheduledDeploy>().UpdateAsync(scheduled, ct);
            await unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation("Scheduled deploy {Id} queued. Job: {JobId}. DeployJobWorker will execute it.",
                scheduled.Id, jobId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Scheduled deploy {Id} failed to trigger.", scheduled.Id);

            scheduled.Status = ScheduledDeployStatus.Failed;
            scheduled.CompletedAt = DateTime.UtcNow;
            scheduled.ErrorMessage = ex.Message;
            await unitOfWork.Repository<ScheduledDeploy>().UpdateAsync(scheduled, ct);
            await unitOfWork.SaveChangesAsync(ct);

            if (scheduled.NotifyOnComplete)
            {
                await emailService.SendDeployResultNotificationAsync(
                    siteName, packageFileName, "Failed", null, ex.Message, 0, recipients, ct);
            }
        }
    }
}
