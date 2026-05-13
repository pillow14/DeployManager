using MediatR;
using DeployManager.Application.DTOs.DeploySites;

namespace DeployManager.Application.Features.DeploySites.Queries;

public class GetAllDeploySitesQuery : IRequest<IEnumerable<DeploySiteDto>>
{
    public Guid? EnvironmentId { get; set; }
    public bool IncludeInactive { get; set; }
}
