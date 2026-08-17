using MediatR;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.DTOs.Rollback;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Rollback.Queries;

public class GetRollbackPreviewQuery : IRequest<RollbackPreviewDto>
{
    public Guid OriginalDeployJobId { get; set; }
}

public class GetRollbackPreviewQueryHandler : IRequestHandler<GetRollbackPreviewQuery, RollbackPreviewDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBackupManifestService _manifestService;
    private readonly IStoragePathProvider _paths;

    public GetRollbackPreviewQueryHandler(IUnitOfWork unitOfWork, IBackupManifestService manifestService, IStoragePathProvider paths)
    {
        _unitOfWork = unitOfWork;
        _manifestService = manifestService;
        _paths = paths;
    }

    public async Task<RollbackPreviewDto> Handle(GetRollbackPreviewQuery request, CancellationToken cancellationToken)
    {
        var originalJob = await _unitOfWork.Repository<DeployJob>()
            .GetByIdAsync(request.OriginalDeployJobId, cancellationToken);

        if (originalJob is null)
            throw new InvalidOperationException($"Deploy job {request.OriginalDeployJobId} not found.");

        if (originalJob.Status != DeployStatus.Completed)
            throw new InvalidOperationException("Only completed deployments can be previewed for rollback.");

        var site = await _unitOfWork.Repository<DeploySite>().GetByIdAsync(originalJob.SiteId, cancellationToken);
        DeployEnvironment? env = null;
        if (site is not null)
            env = await _unitOfWork.Repository<DeployEnvironment>().GetByIdAsync(site.EnvironmentId, cancellationToken);

        var manifest = await _manifestService.GetManifestAsync(originalJob, cancellationToken);

        var backupPath = GetBackupPath(originalJob);

        return new RollbackPreviewDto
        {
            OriginalDeployJobId = originalJob.Id,
            SiteName = site?.Name ?? "Unknown",
            EnvironmentName = env?.Name ?? "",
            FileName = originalJob.FileName,
            DeployedAt = originalJob.CreatedAt,
            BackupPath = backupPath,
            TotalFiles = manifest.Count,
            FilesToRestore = manifest.Count(f => f.ExistedBeforeDeploy),
            FilesToDelete = manifest.Count(f => f.CreatedByDeploy && !f.ExistedBeforeDeploy),
            TotalSizeBytes = manifest.Sum(f => f.SizeInBytes),
            Files = manifest.Select(f => new RollbackPreviewFileDto
            {
                RelativePath = f.RelativePath,
                SizeInBytes = f.SizeInBytes,
                ExistedBeforeDeploy = f.ExistedBeforeDeploy,
                CreatedByDeploy = f.CreatedByDeploy,
                Action = f.Action,
                WillBe = f.ExistedBeforeDeploy ? "Restaurado" : "Eliminado"
            }).ToList()
        };
    }

    private string GetBackupPath(DeployJob job)
    {
        return _paths.GetRollbackRoot(job.Id);
    }
}
