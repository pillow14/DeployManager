using MediatR;
using DeployManager.Application.DTOs.DeploySites;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Environments.Queries;

public class GetAllEnvironmentsQueryHandler : IRequestHandler<GetAllEnvironmentsQuery, IEnumerable<EnvironmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllEnvironmentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<EnvironmentDto>> Handle(GetAllEnvironmentsQuery request, CancellationToken cancellationToken)
    {
        var environments = await _unitOfWork.Repository<DeployEnvironment>()
            .FindAsync(e => !e.IsDeleted, cancellationToken);

        return environments
            .OrderBy(e => e.Name)
            .Select(e => new EnvironmentDto
            {
                Id = e.Id,
                Name = e.Name,
                Description = e.Description,
                TargetType = e.TargetType.ToString(),
                TargetUrl = e.TargetUrl,
                IsActive = e.IsActive
            });
    }
}
