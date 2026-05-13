using MediatR;
using DeployManager.Application.DTOs.DeploySites;

namespace DeployManager.Application.Features.Environments.Queries;

public class GetEnvironmentByIdQuery : IRequest<EnvironmentDto>
{
    public Guid Id { get; set; }
}
