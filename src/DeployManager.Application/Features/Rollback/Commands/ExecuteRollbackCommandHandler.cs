using MediatR;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.DTOs.Rollback;
using DeployManager.Domain.Common;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Rollback.Commands;

public class ExecuteRollbackCommandHandler : IRequestHandler<ExecuteRollbackCommand, RollbackExecutionDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRollbackService _rollbackService;

    public ExecuteRollbackCommandHandler(IUnitOfWork unitOfWork, IRollbackService rollbackService)
    {
        _unitOfWork = unitOfWork;
        _rollbackService = rollbackService;
    }

    public async Task<RollbackExecutionDto> Handle(ExecuteRollbackCommand request, CancellationToken cancellationToken)
    {
        var originalJob = await _unitOfWork.Repository<DeployJob>()
            .GetByIdAsync(request.OriginalDeployJobId, cancellationToken);

        if (originalJob is null)
            throw new InvalidOperationException($"Deploy job {request.OriginalDeployJobId} not found.");

        if (originalJob.Status != DeployStatus.Completed)
            throw new InvalidOperationException("Only completed deployments can be rolled back.");

        var existingRollback = (await _unitOfWork.Repository<RollbackExecution>()
            .FindAsync(r => r.OriginalExecutionId == request.OriginalDeployJobId
                && (r.Status == RollbackStatus.Pending || r.Status == RollbackStatus.InProgress), cancellationToken))
            .FirstOrDefault();

        if (existingRollback is not null)
            throw new InvalidOperationException("A rollback is already in progress for this deployment.");

        var user = await _unitOfWork.Repository<User>()
            .GetByIdAsync(request.ExecutedByUserId, cancellationToken);

        if (user is null || (user.Role != Roles.Administrator && user.Role != Roles.Publisher))
            throw new UnauthorizedAccessException("Only Administrators and Publishers can execute rollbacks.");

        var execution = new RollbackExecution
        {
            OriginalExecutionId = request.OriginalDeployJobId,
            SiteId = originalJob.SiteId,
            Status = RollbackStatus.Pending,
            ExecutedByUserId = request.ExecutedByUserId,
            Reason = request.Reason
        };

        await _unitOfWork.Repository<RollbackExecution>().AddAsync(execution, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _rollbackService.ExecuteRollbackAsync(execution.Id, cancellationToken);

        var completed = await _unitOfWork.Repository<RollbackExecution>()
            .GetByIdAsync(execution.Id, cancellationToken);

        if (completed is null)
            throw new InvalidOperationException("Rollback execution not found after completion.");

        var site = await _unitOfWork.Repository<DeploySite>().GetByIdAsync(completed.SiteId, cancellationToken);
        DeployEnvironment? env = null;
        if (site is not null)
            env = await _unitOfWork.Repository<DeployEnvironment>().GetByIdAsync(site.EnvironmentId, cancellationToken);

        var execUser = await _unitOfWork.Repository<User>().GetByIdAsync(completed.ExecutedByUserId ?? Guid.Empty, cancellationToken);

        return MapToDto(completed, site, env, execUser);
    }

    private static RollbackExecutionDto MapToDto(RollbackExecution execution, DeploySite? site, DeployEnvironment? env, User? user)
    {
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
            Details = execution.Details.Select(d => new RollbackExecutionDetailDto
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
