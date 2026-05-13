using MediatR;
using DeployManager.Application.DTOs.DeploySites;

namespace DeployManager.Application.Features.Environments.Queries;

public class GetAllEnvironmentsQuery : IRequest<IEnumerable<EnvironmentDto>> { }
