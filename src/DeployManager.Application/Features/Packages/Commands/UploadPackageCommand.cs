using MediatR;
using DeployManager.Application.DTOs.Packages;
using DeployManager.Application.Common.Interfaces;

namespace DeployManager.Application.Features.Packages.Commands;

public class UploadPackageCommand : IRequest<PackageDto>
{
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public Stream FileContent { get; set; } = Stream.Null;
}
