using MediatR;

namespace DeployManager.Application.Features.Packages.Queries;

public class GetPackageByIdQuery : IRequest<DeployManager.Domain.Entities.DeployPackage?>
{
    public Guid Id { get; set; }
}
