using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Packages.Queries;

public class GetPackageByIdQueryHandler : IRequestHandler<GetPackageByIdQuery, DeployPackage?>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetPackageByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DeployPackage?> Handle(GetPackageByIdQuery request, CancellationToken cancellationToken)
    {
        return await _unitOfWork.Repository<DeployPackage>()
            .GetByIdAsync(request.Id, cancellationToken);
    }
}
