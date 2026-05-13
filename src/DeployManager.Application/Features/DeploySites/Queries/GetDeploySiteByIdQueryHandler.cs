using MediatR;
using DeployManager.Application.DTOs.DeploySites;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeploySites.Queries;

public class GetDeploySiteByIdQueryHandler : IRequestHandler<GetDeploySiteByIdQuery, DeploySiteDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDeploySiteByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DeploySiteDto> Handle(GetDeploySiteByIdQuery request, CancellationToken cancellationToken)
    {
        var site = await _unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (site is null || site.IsDeleted)
            throw new KeyNotFoundException("Site not found.");

        var environment = await _unitOfWork.Repository<DeployEnvironment>()
            .GetByIdAsync(site.EnvironmentId, cancellationToken);

        return new DeploySiteDto
        {
            Id = site.Id,
            Code = site.Code,
            Name = site.Name,
            EnvironmentId = site.EnvironmentId,
            EnvironmentName = environment?.Name ?? string.Empty,
            TargetType = site.TargetType.ToString(),
            RootPath = site.RootPath,
            PublicUrl = site.PublicUrl,
            Username = site.Username,
            IsActive = site.IsActive,
            CreatedAt = site.CreatedAt,
            UpdatedAt = site.UpdatedAt
        };
    }
}
