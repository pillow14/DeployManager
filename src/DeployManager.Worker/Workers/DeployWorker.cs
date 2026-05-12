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

                var pendingJobs = await unitOfWork.Repository<DeployJob>()
                    .FindAsync(j => j.Status == DeployStatus.Pending, stoppingToken);

                foreach (var job in pendingJobs)
                {
                    _logger.LogInformation("Processing deploy job {JobId}", job.Id);
                    job.Status = DeployStatus.InProgress;
                    job.StartedAt = DateTime.UtcNow;
                    await unitOfWork.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing deploy jobs.");
            }

            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
    }
}
