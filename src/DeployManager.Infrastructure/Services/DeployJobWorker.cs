using System.Diagnostics;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;
using DeployManager.Infrastructure.Data;

namespace DeployManager.Infrastructure.Services;

public class DeployJobWorker : BackgroundService
{
    private const int BatchSize = 10;
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(15);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DeployJobWorker> _logger;

    public DeployJobWorker(IServiceScopeFactory scopeFactory, ILogger<DeployJobWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DeployJobWorker started.");

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
                _logger.LogError(ex, "Error in DeployJobWorker tick.");
            }

            await Task.Delay(PollInterval, stoppingToken);
        }

        _logger.LogInformation("DeployJobWorker stopped.");
    }

    private async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var runner = scope.ServiceProvider.GetRequiredService<IDeployRunnerService>();
        var targets = scope.ServiceProvider.GetRequiredService<IEnumerable<IDeployTarget>>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var context = scope.ServiceProvider.GetRequiredService<DeployDbContext>();

        var pendingIds = await context.DeployJobs
            .Where(j => j.Status == DeployStatus.Pending && !j.IsDeleted)
            .OrderBy(j => j.CreatedAt)
            .Take(BatchSize)
            .Select(j => j.Id)
            .ToListAsync(ct);

        foreach (var jobId in pendingIds)
        {
            var claimed = await context.DeployJobs
                .Where(j => j.Id == jobId && j.Status == DeployStatus.Pending)
                .ExecuteUpdateAsync(s => s.SetProperty(j => j.Status, DeployStatus.InProgress), ct);

            if (claimed == 0)
                continue;

            var job = await unitOfWork.Repository<DeployJob>().GetByIdAsync(jobId, ct);
            if (job is null)
                continue;

            job.StartedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(ct);

            _logger.LogInformation("Processing deploy job {JobId}", job.Id);

            var sw = Stopwatch.StartNew();
            try
            {
                var site = await unitOfWork.Repository<DeploySite>()
                    .GetByIdAsync(job.SiteId, ct);

                if (site is null)
                {
                    await FailJobAsync(unitOfWork, job, "Associated site not found.", ct);
                    continue;
                }

                var target = targets.FirstOrDefault(t => t.TargetType == site.TargetType);
                if (target is null)
                {
                    await FailJobAsync(unitOfWork, job, $"No deploy target configured for {site.TargetType}.", ct);
                    continue;
                }

                await runner.ExecuteAsync(job, target, ct);
                sw.Stop();
                _logger.LogInformation("Job {JobId} processed with status {Status}.", job.Id, job.Status);
                await NotifyScheduledDeployAsync(unitOfWork, emailService, job, sw.Elapsed, ct);
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogError(ex, "Job {JobId} failed unexpectedly.", job.Id);
                await FailJobAsync(unitOfWork, job, $"Unexpected error: {ex.Message}", ct);
                await NotifyScheduledDeployAsync(unitOfWork, emailService, job, sw.Elapsed, ct);
            }
        }
    }

    private static async Task FailJobAsync(IUnitOfWork unitOfWork, DeployJob job, string error, CancellationToken ct)
    {
        if (job.Status is DeployStatus.Completed or DeployStatus.RolledBack or DeployStatus.Failed)
            return;

        job.Status = DeployStatus.Failed;
        job.ErrorMessage = error;
        job.CompletedAt = DateTime.UtcNow;
        await unitOfWork.Repository<DeployJob>().UpdateAsync(job, ct);
        await unitOfWork.SaveChangesAsync(ct);
    }

    private static async Task NotifyScheduledDeployAsync(
        IUnitOfWork unitOfWork,
        IEmailService emailService,
        DeployJob job,
        TimeSpan duration,
        CancellationToken ct)
    {
        var scheduled = (await unitOfWork.Repository<ScheduledDeploy>()
            .FindAsync(s => s.JobId == job.Id, ct))
            .FirstOrDefault();

        if (scheduled is null)
            return;

        var site = await unitOfWork.Repository<DeploySite>().GetByIdAsync(job.SiteId, ct);
        var package = job.PackageId.HasValue
            ? await unitOfWork.Repository<DeployPackage>().GetByIdAsync(job.PackageId.Value, ct)
            : null;

        var siteName = site?.Name ?? "Unknown";
        var packageFileName = package?.FileName ?? job.FileName ?? "Unknown";
        var recipients = JsonSerializer.Deserialize<List<string>>(scheduled.Recipients) ?? new();

        var isCompleted = job.Status == DeployStatus.Completed;
        scheduled.Status = isCompleted ? ScheduledDeployStatus.Completed : ScheduledDeployStatus.Failed;
        scheduled.CompletedAt = DateTime.UtcNow;
        scheduled.ErrorMessage = isCompleted ? null : job.ErrorMessage;
        await unitOfWork.Repository<ScheduledDeploy>().UpdateAsync(scheduled, ct);
        await unitOfWork.SaveChangesAsync(ct);

        if (!scheduled.NotifyOnComplete)
            return;

        var fileCount = 0;
        if (job.LogSummary is not null)
        {
            var match = Regex.Match(job.LogSummary, @"\d+");
            if (match.Success)
                int.TryParse(match.Value, out fileCount);
        }

        await emailService.SendDeployResultNotificationAsync(
            siteName,
            packageFileName,
            isCompleted ? "Completed" : "Failed",
            duration.ToString(@"hh\:mm\:ss"),
            isCompleted ? null : job.ErrorMessage,
            fileCount,
            recipients,
            ct);
    }
}
