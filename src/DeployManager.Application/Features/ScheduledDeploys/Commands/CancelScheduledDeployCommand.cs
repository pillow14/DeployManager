using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.ScheduledDeploys.Commands;

public class CancelScheduledDeployCommand : IRequest
{
    public Guid Id { get; set; }
}

public class CancelScheduledDeployCommandHandler : IRequestHandler<CancelScheduledDeployCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public CancelScheduledDeployCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(CancelScheduledDeployCommand request, CancellationToken cancellationToken)
    {
        var scheduled = await _unitOfWork.Repository<ScheduledDeploy>()
            .GetByIdAsync(request.Id, cancellationToken);
        if (scheduled is null || scheduled.IsDeleted)
            throw new KeyNotFoundException("Scheduled deploy not found.");

        if (scheduled.Status != ScheduledDeployStatus.Pending)
            throw new InvalidOperationException("Only pending scheduled deploys can be cancelled.");

        scheduled.Status = ScheduledDeployStatus.Cancelled;
        scheduled.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Repository<ScheduledDeploy>().UpdateAsync(scheduled, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
