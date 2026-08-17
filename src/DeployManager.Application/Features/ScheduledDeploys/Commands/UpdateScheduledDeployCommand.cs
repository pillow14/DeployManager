using System.Text.Json;
using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.ScheduledDeploys.Commands;

public class UpdateScheduledDeployCommand : IRequest
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public List<string> Recipients { get; set; } = new();
    public bool NotifyOnStart { get; set; } = true;
    public bool NotifyOnComplete { get; set; } = true;
}

public class UpdateScheduledDeployCommandHandler : IRequestHandler<UpdateScheduledDeployCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateScheduledDeployCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateScheduledDeployCommand request, CancellationToken cancellationToken)
    {
        var scheduled = await _unitOfWork.Repository<ScheduledDeploy>()
            .GetByIdAsync(request.Id, cancellationToken);
        if (scheduled is null || scheduled.IsDeleted)
            throw new KeyNotFoundException("Scheduled deploy not found.");

        if (scheduled.Status != ScheduledDeployStatus.Pending)
            throw new InvalidOperationException("Only pending scheduled deploys can be updated.");

        scheduled.Name = request.Name;
        scheduled.ScheduledAt = request.ScheduledAt;
        scheduled.Recipients = JsonSerializer.Serialize(request.Recipients);
        scheduled.NotifyOnStart = request.NotifyOnStart;
        scheduled.NotifyOnComplete = request.NotifyOnComplete;
        scheduled.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Repository<ScheduledDeploy>().UpdateAsync(scheduled, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
