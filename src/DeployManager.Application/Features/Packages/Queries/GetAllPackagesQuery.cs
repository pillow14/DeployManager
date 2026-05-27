using MediatR;
using DeployManager.Application.DTOs.Packages;

namespace DeployManager.Application.Features.Packages.Queries;

public class GetAllPackagesQuery : IRequest<List<PackageDto>>
{
}
