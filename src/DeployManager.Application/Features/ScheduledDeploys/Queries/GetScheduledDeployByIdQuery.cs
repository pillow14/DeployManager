using MediatR;
using DeployManager.Application.DTOs.ScheduledDeploy;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.ScheduledDeploys.Queries;

public class GetScheduledDeployByIdQuery : IRequest<ScheduledDeployDetailDto?>
{
    public Guid Id { get; set; }
}

public class GetScheduledDeployByIdQueryHandler : IRequestHandler<GetScheduledDeployByIdQuery, ScheduledDeployDetailDto?>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetScheduledDeployByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ScheduledDeployDetailDto?> Handle(GetScheduledDeployByIdQuery request, CancellationToken cancellationToken)
    {
        var item = await _unitOfWork.Repository<ScheduledDeploy>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (item is null || item.IsDeleted)
            return null;

        var site = await _unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(item.SiteId, cancellationToken);
        var user = await _unitOfWork.Repository<User>()
            .GetByIdAsync(item.CreatedByUserId, cancellationToken);
        var package = item.PackageId.HasValue
            ? await _unitOfWork.Repository<DeployPackage>().GetByIdAsync(item.PackageId.Value, cancellationToken)
            : null;

        return new ScheduledDeployDetailDto
        {
            Id = item.Id,
            Name = item.Name,
            SiteId = item.SiteId,
            SiteName = site?.Name ?? "Unknown",
            PackageId = item.PackageId,
            PackageFileName = package?.FileName,
            ScheduledAt = item.ScheduledAt,
            Status = item.Status.ToString(),
            CreatedByUserName = user?.Username ?? "Unknown",
            Recipients = System.Text.Json.JsonSerializer.Deserialize<List<string>>(item.Recipients) ?? new(),
            NotifyOnStart = item.NotifyOnStart,
            NotifyOnComplete = item.NotifyOnComplete,
            StartedAt = item.StartedAt,
            CompletedAt = item.CompletedAt,
            JobId = item.JobId,
            ErrorMessage = item.ErrorMessage,
            CreatedAt = item.CreatedAt
        };
    }
}
