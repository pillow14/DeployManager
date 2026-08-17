using MediatR;
using DeployManager.Application.DTOs.ScheduledDeploy;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.ScheduledDeploys.Queries;

public class GetAllScheduledDeploysQuery : IRequest<List<ScheduledDeployDto>>
{
}

public class GetAllScheduledDeploysQueryHandler : IRequestHandler<GetAllScheduledDeploysQuery, List<ScheduledDeployDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllScheduledDeploysQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<ScheduledDeployDto>> Handle(GetAllScheduledDeploysQuery request, CancellationToken cancellationToken)
    {
        var items = await _unitOfWork.Repository<ScheduledDeploy>()
            .GetAllAsync(cancellationToken);

        var result = new List<ScheduledDeployDto>();

        foreach (var item in items.OrderByDescending(s => s.CreatedAt))
        {
            var site = await _unitOfWork.Repository<DeploySite>()
                .GetByIdAsync(item.SiteId, cancellationToken);
            var user = await _unitOfWork.Repository<User>()
                .GetByIdAsync(item.CreatedByUserId, cancellationToken);
            var package = item.PackageId.HasValue
                ? await _unitOfWork.Repository<DeployPackage>().GetByIdAsync(item.PackageId.Value, cancellationToken)
                : null;

            result.Add(new ScheduledDeployDto
            {
                Id = item.Id,
                Name = item.Name,
                SiteId = item.SiteId,
                SiteName = site?.Name ?? "Unknown",
                PackageFileName = package?.FileName,
                ScheduledAt = item.ScheduledAt,
                Status = item.Status.ToString(),
                CreatedByUserName = user?.Username ?? "Unknown",
                Recipients = System.Text.Json.JsonSerializer.Deserialize<List<string>>(item.Recipients) ?? new(),
                NotifyOnStart = item.NotifyOnStart,
                NotifyOnComplete = item.NotifyOnComplete,
                CreatedAt = item.CreatedAt
            });
        }

        return result;
    }
}
