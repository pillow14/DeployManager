using MediatR;
using DeployManager.Application.DTOs.Rollback;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Rollback.Queries;

public class GetRollbackExecutionByIdQuery : IRequest<RollbackExecutionDto?>
{
    public Guid Id { get; set; }
}

public class GetRollbackExecutionByIdQueryHandler : IRequestHandler<GetRollbackExecutionByIdQuery, RollbackExecutionDto?>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetRollbackExecutionByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<RollbackExecutionDto?> Handle(GetRollbackExecutionByIdQuery request, CancellationToken cancellationToken)
    {
        var execution = await _unitOfWork.Repository<RollbackExecution>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (execution is null)
            return null;

        var site = await _unitOfWork.Repository<DeploySite>().GetByIdAsync(execution.SiteId, cancellationToken);
        DeployEnvironment? env = null;
        if (site is not null)
            env = await _unitOfWork.Repository<DeployEnvironment>().GetByIdAsync(site.EnvironmentId, cancellationToken);

        var user = await _unitOfWork.Repository<User>()
            .GetByIdAsync(execution.ExecutedByUserId ?? Guid.Empty, cancellationToken);

        var details = await _unitOfWork.Repository<RollbackExecutionDetail>()
            .FindAsync(d => d.RollbackExecutionId == execution.Id, cancellationToken);

        return new RollbackExecutionDto
        {
            Id = execution.Id,
            OriginalExecutionId = execution.OriginalExecutionId,
            SiteId = execution.SiteId,
            SiteName = site?.Name ?? "Unknown",
            EnvironmentName = env?.Name ?? "",
            Status = execution.Status.ToString(),
            ExecutedByUserName = user?.Username,
            Reason = execution.Reason,
            StartedAt = execution.StartedAt,
            FinishedAt = execution.FinishedAt,
            ErrorMessage = execution.ErrorMessage,
            CreatedAt = execution.CreatedAt,
            Details = details.Select(d => new RollbackExecutionDetailDto
            {
                Id = d.Id,
                RelativePath = d.RelativePath,
                OriginalTargetFile = d.OriginalTargetFile,
                BackupFile = d.BackupFile,
                Action = d.Action,
                Status = d.Status.ToString(),
                Message = d.Message
            }).ToList()
        };
    }
}
