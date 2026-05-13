using MediatR;
using DeployManager.Application.DTOs.DeploySites;

namespace DeployManager.Application.Features.DeploySites.Queries;

public class GetDeploySiteByIdQuery : IRequest<DeploySiteDto>
{
    public Guid Id { get; set; }
}
