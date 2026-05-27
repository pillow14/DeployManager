using MediatR;
using DeployManager.Application.Common.Helpers;
using DeployManager.Application.DTOs.Deploy;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Deploy.Commands;

public class UploadPreviewCommand : IRequest<DeployPreviewDto>
{
    public Guid SiteId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public Stream FileContent { get; set; } = Stream.Null;
}

public class UploadPreviewCommandHandler : IRequestHandler<UploadPreviewCommand, DeployPreviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorage;

    public UploadPreviewCommandHandler(IUnitOfWork unitOfWork, IFileStorageService fileStorage)
    {
        _unitOfWork = unitOfWork;
        _fileStorage = fileStorage;
    }

    public async Task<DeployPreviewDto> Handle(UploadPreviewCommand request, CancellationToken cancellationToken)
    {
        var site = await _unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(request.SiteId, cancellationToken);

        if (site is null || site.IsDeleted)
            throw new KeyNotFoundException("Site not found.");

        var package = new DeployPackage
        {
            SiteId = request.SiteId,
            FileName = request.FileName,
            FileSize = request.FileSize
        };

        package.StoredPath = _fileStorage.SavePackage(package.Id.ToString(), request.FileName, request.FileContent);

        await _unitOfWork.Repository<DeployPackage>().AddAsync(package, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var extractPath = _fileStorage.ExtractToDirectory(package.StoredPath);
        var files = _fileStorage.GetFiles(extractPath);

        var rules = await _unitOfWork.Repository<DeployRule>()
            .FindAsync(r => r.IsActive && !r.IsDeleted, cancellationToken);
        var orderedRules = rules.OrderBy(r => r.Order).ToList();

        var previewFiles = new List<DeployFilePreviewDto>();
        var summary = new DeploySummaryDto();

        foreach (var filePath in files)
        {
            var relativePath = Path.GetRelativePath(extractPath, filePath).Replace('\\', '/');
            var size = _fileStorage.GetFileSize(filePath);

            var matchedRule = orderedRules.FirstOrDefault(r =>
                GlobHelper.Match(relativePath, r.SourcePattern));

            var action = matchedRule?.Action ?? "copy_overwrite";
            var previewFile = new DeployFilePreviewDto
            {
                FilePath = relativePath,
                FileSize = size,
                Action = action,
                MatchedRule = matchedRule?.Id.ToString(),
                MatchedRuleName = matchedRule?.Name
            };
            previewFiles.Add(previewFile);

            switch (action)
            {
                case "copy_overwrite":
                case "copy_if_not_exists":
                    summary.ToCopy++;
                    break;
                case "omit":
                    summary.ToOmit++;
                    break;
                case "backup_and_copy":
                    summary.ToBackup++;
                    break;
                case "delete_and_copy":
                    summary.ToDelete++;
                    break;
            }
        }

        summary.TotalFiles = previewFiles.Count;

        return new DeployPreviewDto
        {
            PackageId = package.Id,
            SiteId = site.Id,
            SiteName = site.Name,
            FileName = request.FileName,
            FileSize = request.FileSize,
            Files = previewFiles,
            Summary = summary
        };
    }

}
