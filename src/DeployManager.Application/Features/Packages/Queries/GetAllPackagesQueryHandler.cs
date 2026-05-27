using MediatR;
using DeployManager.Application.DTOs.Packages;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Packages.Queries;

public class GetAllPackagesQueryHandler : IRequestHandler<GetAllPackagesQuery, List<PackageDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllPackagesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<PackageDto>> Handle(GetAllPackagesQuery request, CancellationToken cancellationToken)
    {
        var packages = await _unitOfWork.Repository<DeployPackage>()
            .FindAsync(p => !p.IsDeleted, cancellationToken);

        var siteIds = packages
            .Where(p => p.SiteId.HasValue)
            .Select(p => p.SiteId!.Value)
            .Distinct()
            .ToList();

        var siteMap = new Dictionary<Guid, string>();
        if (siteIds.Count != 0)
        {
            var sites = await _unitOfWork.Repository<DeploySite>()
                .FindAsync(s => siteIds.Contains(s.Id), cancellationToken);
            foreach (var s in sites)
                siteMap[s.Id] = s.Name;
        }

        return packages.OrderByDescending(p => p.CreatedAt).Select(p => new PackageDto
        {
            Id = p.Id,
            FileName = p.FileName,
            FileSize = p.FileSize,
            Status = p.Status,
            SiteName = p.SiteId.HasValue ? siteMap.GetValueOrDefault(p.SiteId.Value) : null,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
        }).ToList();
    }
}
