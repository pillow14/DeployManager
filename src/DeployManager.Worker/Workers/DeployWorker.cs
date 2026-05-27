using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Worker.Workers;

public class DeployWorker : BackgroundService
{
    private readonly ILogger<DeployWorker> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public DeployWorker(ILogger<DeployWorker> logger, IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DeployManager Worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var runner = scope.ServiceProvider.GetRequiredService<IDeployRunnerService>();
                var targets = scope.ServiceProvider.GetRequiredService<IEnumerable<IDeployTarget>>();

                var pendingJobs = await unitOfWork.Repository<DeployJob>()
                    .FindAsync(j => j.Status == DeployStatus.Pending, stoppingToken);

                foreach (var job in pendingJobs)
                {
                    _logger.LogInformation("Processing deploy job {JobId}", job.Id);

                    job.Status = DeployStatus.InProgress;
                    job.StartedAt = DateTime.UtcNow;
                    await unitOfWork.SaveChangesAsync(stoppingToken);

                    try
                    {
                        var site = await unitOfWork.Repository<DeploySite>()
                            .GetByIdAsync(job.SiteId, stoppingToken);

                        if (site is null)
                        {
                            _logger.LogWarning("Site {SiteId} not found for job {JobId}", job.SiteId, job.Id);
                            job.Status = DeployStatus.Failed;
                            job.ErrorMessage = "Associated site not found.";
                            job.CompletedAt = DateTime.UtcNow;
                            await unitOfWork.SaveChangesAsync(stoppingToken);
                            continue;
                        }

                        var target = targets.FirstOrDefault(t => t.TargetType == site.TargetType);
                        if (target is null)
                        {
                            _logger.LogWarning("No deploy target for {TargetType} site {SiteId}", site.TargetType, site.Id);
                            job.Status = DeployStatus.Failed;
                            job.ErrorMessage = $"No deploy target configured for {site.TargetType}.";
                            job.CompletedAt = DateTime.UtcNow;
                            await unitOfWork.SaveChangesAsync(stoppingToken);
                            continue;
                        }

                        await runner.ExecuteAsync(job, target, stoppingToken);
                        _logger.LogInformation("Job {JobId} processed successfully.", job.Id);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Job {JobId} failed unexpectedly.", job.Id);
                        job.Status = DeployStatus.Failed;
                        job.ErrorMessage = $"Unexpected error: {ex.Message}";
                        job.CompletedAt = DateTime.UtcNow;
                        await unitOfWork.SaveChangesAsync(stoppingToken);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in worker loop.");
            }

            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
    }
}
