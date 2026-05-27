using MediatR;
using DeployManager.Application.DTOs.Packages;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Packages.Commands;

public class UploadPackageCommandHandler : IRequestHandler<UploadPackageCommand, PackageDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorage;

    public UploadPackageCommandHandler(IUnitOfWork unitOfWork, IFileStorageService fileStorage)
    {
        _unitOfWork = unitOfWork;
        _fileStorage = fileStorage;
    }

    public async Task<PackageDto> Handle(UploadPackageCommand request, CancellationToken cancellationToken)
    {
        var package = new DeployPackage
        {
            FileName = request.FileName,
            FileSize = request.FileSize,
            Status = "Uploaded"
        };

        package.StoredPath = _fileStorage.SavePackage(package.Id.ToString(), request.FileName, request.FileContent);

        await _unitOfWork.Repository<DeployPackage>().AddAsync(package, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PackageDto
        {
            Id = package.Id,
            FileName = package.FileName,
            FileSize = package.FileSize,
            Status = package.Status,
            CreatedAt = package.CreatedAt,
            UpdatedAt = package.UpdatedAt,
        };
    }
}
