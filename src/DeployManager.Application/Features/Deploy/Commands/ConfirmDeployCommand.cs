using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Deploy.Commands;

public class ConfirmDeployCommand : IRequest<Guid>
{
    public Guid PackageId { get; set; }
}

public class ConfirmDeployCommandHandler : IRequestHandler<ConfirmDeployCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmDeployCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(ConfirmDeployCommand request, CancellationToken cancellationToken)
    {
        var package = await _unitOfWork.Repository<DeployPackage>()
            .GetByIdAsync(request.PackageId, cancellationToken);

        if (package is null || package.IsDeleted)
            throw new KeyNotFoundException("Package not found.");
        if (package.Status != "Uploaded")
            throw new InvalidOperationException("Package has already been deployed.");

        if (package.SiteId is null)
            throw new InvalidOperationException("Package must be associated with a site for deployment.");

        var job = new DeployJob
        {
            SiteId = package.SiteId.Value,
            PackageId = package.Id,
            FileName = package.FileName,
            FileSize = package.FileSize,
            Status = DeployStatus.Pending
        };

        await _unitOfWork.Repository<DeployJob>().AddAsync(job, cancellationToken);

        package.Status = "Deployed";
        package.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Repository<DeployPackage>().UpdateAsync(package, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return job.Id;
    }
}
