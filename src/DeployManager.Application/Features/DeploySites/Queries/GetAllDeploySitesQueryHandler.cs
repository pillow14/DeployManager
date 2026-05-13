using MediatR;
using DeployManager.Application.DTOs.DeploySites;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeploySites.Queries;

public class GetAllDeploySitesQueryHandler : IRequestHandler<GetAllDeploySitesQuery, IEnumerable<DeploySiteDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllDeploySitesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<DeploySiteDto>> Handle(GetAllDeploySitesQuery request, CancellationToken cancellationToken)
    {
        var sites = await _unitOfWork.Repository<DeploySite>()
            .FindAsync(s => !s.IsDeleted, cancellationToken);

        if (request.EnvironmentId.HasValue)
            sites = sites.Where(s => s.EnvironmentId == request.EnvironmentId.Value);

        if (!request.IncludeInactive)
            sites = sites.Where(s => s.IsActive);

        var environmentIds = sites.Select(s => s.EnvironmentId).Distinct();
        var environments = await _unitOfWork.Repository<DeployEnvironment>()
            .FindAsync(e => environmentIds.Contains(e.Id), cancellationToken);

        var envLookup = environments.ToDictionary(e => e.Id, e => e.Name);

        return sites
            .OrderBy(s => s.Name)
            .Select(s => new DeploySiteDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                EnvironmentId = s.EnvironmentId,
                EnvironmentName = envLookup.GetValueOrDefault(s.EnvironmentId, string.Empty),
                TargetType = s.TargetType.ToString(),
                RootPath = s.RootPath,
                PublicUrl = s.PublicUrl,
                Username = s.Username,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            });
    }
}
