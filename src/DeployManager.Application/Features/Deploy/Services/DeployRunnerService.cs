using System.IO.Compression;
using Microsoft.Extensions.Logging;
using DeployManager.Application.Common.Helpers;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Deploy.Services;

public class DeployRunnerService : IDeployRunnerService
{
    private readonly IFileStorageService _fileStorage;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeployRunnerService> _logger;

    public DeployRunnerService(
        IFileStorageService fileStorage,
        IUnitOfWork unitOfWork,
        ILogger<DeployRunnerService> logger)
    {
        _fileStorage = fileStorage;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task ExecuteAsync(DeployJob job, IDeployTarget target, CancellationToken cancellationToken)
    {
        DeployPackage? package;
        if (job.PackageId.HasValue)
        {
            package = await _unitOfWork.Repository<DeployPackage>()
                .GetByIdAsync(job.PackageId.Value, cancellationToken);
        }
        else
        {
            package = (await _unitOfWork.Repository<DeployPackage>()
                .FindAsync(p => p.FileName == job.FileName && !p.IsDeleted, cancellationToken))
                .FirstOrDefault();
        }

        if (package is null || package.IsDeleted)
        {
            await FailJob(job, "Package not found.", cancellationToken);
            return;
        }

        string extractPath;
        try
        {
            extractPath = _fileStorage.ExtractToDirectory(package.StoredPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract package {PackageId}", package.Id);
            await FailJob(job, $"Failed to extract package: {ex.Message}", cancellationToken);
            return;
        }

        var allFiles = _fileStorage.GetFiles(extractPath).ToList();
        var rules = (await _unitOfWork.Repository<DeployRule>()
            .FindAsync(r => r.IsActive && !r.IsDeleted, cancellationToken))
            .OrderBy(r => r.Order)
            .ToList();

        var site = await _unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(job.SiteId, cancellationToken);

        if (site is null || string.IsNullOrWhiteSpace(site.RootPath))
        {
            await FailJob(job, "Site or RootPath not configured.", cancellationToken);
            return;
        }

        var rootPath = site.RootPath.Replace('/', Path.DirectorySeparatorChar);
        var backupEntries = new List<BackupEntry>();
        var deployEntries = new List<DeployEntry>();

        foreach (var filePath in allFiles)
        {
            var relativePath = Path.GetRelativePath(extractPath, filePath).Replace('\\', '/');
            var matchedRule = rules.FirstOrDefault(r => GlobHelper.Match(relativePath, r.SourcePattern));
            var action = matchedRule?.Action ?? "copy_overwrite";

            if (action == "omit")
                continue;

            var rawDestPath = matchedRule?.DestinationPath?.Trim().Trim('/', '\\');
            var hasDestPath = !string.IsNullOrWhiteSpace(rawDestPath);

            var destPath = hasDestPath
                ? Path.Combine(rootPath, rawDestPath!.Replace('/', Path.DirectorySeparatorChar), Path.GetFileName(filePath))
                : Path.Combine(rootPath, relativePath.Replace('/', Path.DirectorySeparatorChar));

            if (action is "backup_and_copy" or "copy_overwrite")
            {
                var backupRelativePath = hasDestPath
                    ? Path.Combine(rawDestPath!.Replace('/', Path.DirectorySeparatorChar), Path.GetFileName(filePath)).Replace('\\', '/')
                    : relativePath;
                backupEntries.Add(new BackupEntry(backupRelativePath, destPath));
            }

            deployEntries.Add(new DeployEntry(relativePath, filePath, destPath, action));
        }

        await Log(job, "Info", $"Backing up {backupEntries.Count} files...", cancellationToken);
        string backupRoot;
        try
        {
            backupRoot = await target.BackupAsync(job, backupEntries, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Backup failed for job {JobId}", job.Id);
            await FailJob(job, $"Backup failed: {ex.Message}", cancellationToken);
            return;
        }

        await Log(job, "Info", $"Deploying {deployEntries.Count} files to {rootPath}...", cancellationToken);
        try
        {
            await target.DeployAsync(job, deployEntries, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Deploy failed for job {JobId}, attempting rollback", job.Id);
            await Log(job, "Error", $"Deploy failed: {ex.Message}. Rolling back...", cancellationToken);

            try
            {
                await target.RollbackAsync(job, backupEntries, backupRoot, cancellationToken);
                await Log(job, "Info", "Rollback completed successfully.", cancellationToken);
            }
            catch (Exception rollbackEx)
            {
                _logger.LogError(rollbackEx, "Rollback also failed for job {JobId}", job.Id);
                await Log(job, "Error", $"Rollback also failed: {rollbackEx.Message}", cancellationToken);
            }

            try { Directory.Delete(backupRoot, true); } catch { }

            job.Status = DeployStatus.RolledBack;
            job.ErrorMessage = $"Deploy failed: {ex.Message}";
            job.CompletedAt = DateTime.UtcNow;
            await _unitOfWork.Repository<DeployJob>().UpdateAsync(job, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Deploy cancelled for job {JobId}", job.Id);
            try { Directory.Delete(backupRoot, true); } catch { }
            job.Status = DeployStatus.Failed;
            job.ErrorMessage = "Deployment was cancelled.";
            job.CompletedAt = DateTime.UtcNow;
            await _unitOfWork.Repository<DeployJob>().UpdateAsync(job, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return;
        }

        if (backupEntries.Count > 0)
        {
            try
            {
                var zipDir = Path.Combine(Path.GetTempPath(), "DeployManager", "backup-zips");
                Directory.CreateDirectory(zipDir);
                var zipPath = Path.Combine(zipDir, $"{job.Id}.zip");
                if (File.Exists(zipPath)) File.Delete(zipPath);
                ZipFile.CreateFromDirectory(backupRoot, zipPath);
                await Log(job, "Info", $"Respaldo comprimido: {zipPath}", cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create backup ZIP for job {JobId}", job.Id);
            }

            try { Directory.Delete(backupRoot, true); } catch { }
        }

        job.Status = DeployStatus.Completed;
        job.LogSummary = $"Deployed {deployEntries.Count} files successfully.";
        job.CompletedAt = DateTime.UtcNow;
        await _unitOfWork.Repository<DeployJob>().UpdateAsync(job, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        try
        {
            _fileStorage.Cleanup(extractPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to cleanup extract path {Path}", extractPath);
        }

        _logger.LogInformation("Job {JobId} completed successfully.", job.Id);
    }

    private async Task FailJob(DeployJob job, string error, CancellationToken cancellationToken)
    {
        job.Status = DeployStatus.Failed;
        job.ErrorMessage = error;
        job.CompletedAt = DateTime.UtcNow;
        await _unitOfWork.Repository<DeployJob>().UpdateAsync(job, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await Log(job, "Error", error, cancellationToken);
    }

    private async Task Log(DeployJob job, string level, string message, CancellationToken cancellationToken)
    {
        var log = new DeployLog
        {
            DeployJobId = job.Id,
            Level = level,
            Message = message,
        };
        await _unitOfWork.Repository<DeployLog>().AddAsync(log, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
