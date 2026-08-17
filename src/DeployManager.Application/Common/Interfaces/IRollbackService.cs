namespace DeployManager.Application.Common.Interfaces;

public interface IRollbackService
{
    Task ExecuteRollbackAsync(Guid rollbackExecutionId, CancellationToken cancellationToken = default);
}
