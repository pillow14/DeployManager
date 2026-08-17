using MediatR;
using DeployManager.Application.DTOs.Rollback;

namespace DeployManager.Application.Features.Rollback.Commands;

public class ExecuteRollbackCommand : IRequest<RollbackExecutionDto>
{
    public Guid OriginalDeployJobId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public Guid ExecutedByUserId { get; set; }
}
