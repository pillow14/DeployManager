using DeployManager.Domain.Entities;

namespace DeployManager.Application.Common.Interfaces;

public interface IDeployRunnerService
{
    Task ExecuteAsync(DeployJob job, IDeployTarget target, CancellationToken cancellationToken);
}
