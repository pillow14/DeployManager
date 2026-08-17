using MediatR;
using DeployManager.Application.DTOs.Rollback;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Rollback.Queries;

public class GetRollbackHistoryQuery : IRequest<List<RollbackExecutionDto>>
{
}

public class GetRollbackHistoryQueryHandler : IRequestHandler<GetRollbackHistoryQuery, List<RollbackExecutionDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRollbackHistoryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<RollbackExecutionDto>> Handle(GetRollbackHistoryQuery request, CancellationToken cancellationToken)
    {
        var executions = await _unitOfWork.Repository<RollbackExecution>()
            .GetAllAsync(cancellationToken);

        var result = new List<RollbackExecutionDto>();

        foreach (var exec in executions.OrderByDescending(e => e.CreatedAt))
        {
            var site = await _unitOfWork.Repository<DeploySite>().GetByIdAsync(exec.SiteId, cancellationToken);
            DeployEnvironment? env = null;
            if (site is not null)
                env = await _unitOfWork.Repository<DeployEnvironment>().GetByIdAsync(site.EnvironmentId, cancellationToken);

            var user = await _unitOfWork.Repository<User>()
                .GetByIdAsync(exec.ExecutedByUserId ?? Guid.Empty, cancellationToken);

            result.Add(new RollbackExecutionDto
            {
                Id = exec.Id,
                OriginalExecutionId = exec.OriginalExecutionId,
                SiteId = exec.SiteId,
                SiteName = site?.Name ?? "Unknown",
                EnvironmentName = env?.Name ?? "",
                Status = exec.Status.ToString(),
                ExecutedByUserName = user?.Username,
                Reason = exec.Reason,
                StartedAt = exec.StartedAt,
                FinishedAt = exec.FinishedAt,
                ErrorMessage = exec.ErrorMessage,
                CreatedAt = exec.CreatedAt
            });
        }

        return result;
    }
}
