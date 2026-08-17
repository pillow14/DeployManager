using System.Text.Json;
using MediatR;
using DeployManager.Application.DTOs.ScheduledDeploy;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.ScheduledDeploys.Commands;

public class CreateScheduledDeployCommand : IRequest<Guid>
{
    public string Name { get; set; } = string.Empty;
    public Guid SiteId { get; set; }
    public Guid? PackageId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public Guid CreatedByUserId { get; set; }
    public List<string> Recipients { get; set; } = new();
    public bool NotifyOnStart { get; set; } = true;
    public bool NotifyOnComplete { get; set; } = true;
}

public class CreateScheduledDeployCommandHandler : IRequestHandler<CreateScheduledDeployCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateScheduledDeployCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateScheduledDeployCommand request, CancellationToken cancellationToken)
    {
        var site = await _unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(request.SiteId, cancellationToken);
        if (site is null || site.IsDeleted)
            throw new KeyNotFoundException("Site not found.");

        if (request.PackageId.HasValue)
        {
            var package = await _unitOfWork.Repository<DeployPackage>()
                .GetByIdAsync(request.PackageId.Value, cancellationToken);
            if (package is null || package.IsDeleted)
                throw new KeyNotFoundException("Package not found.");
            if (package.Status != "Uploaded")
                throw new InvalidOperationException("Package has already been deployed.");

            if (package.SiteId is null)
            {
                package.SiteId = request.SiteId;
                package.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.Repository<DeployPackage>().UpdateAsync(package, cancellationToken);
            }
        }

        var scheduled = new ScheduledDeploy
        {
            Name = request.Name,
            SiteId = request.SiteId,
            PackageId = request.PackageId,
            ScheduledAt = request.ScheduledAt,
            Status = ScheduledDeployStatus.Pending,
            CreatedByUserId = request.CreatedByUserId,
            Recipients = JsonSerializer.Serialize(request.Recipients),
            NotifyOnStart = request.NotifyOnStart,
            NotifyOnComplete = request.NotifyOnComplete
        };

        await _unitOfWork.Repository<ScheduledDeploy>().AddAsync(scheduled, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return scheduled.Id;
    }
}
