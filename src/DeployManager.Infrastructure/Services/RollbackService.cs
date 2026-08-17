using Microsoft.Extensions.Logging;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Infrastructure.Services;

public class RollbackService : IRollbackService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IBackupManifestService _manifestService;
    private readonly IDeployTargetFactory _targetFactory;
    private readonly IRollbackSettings _settings;
    private readonly IStoragePathProvider _paths;
    private readonly ILogger<RollbackService> _logger;

    public RollbackService(
        IUnitOfWork unitOfWork,
        IBackupManifestService manifestService,
        IDeployTargetFactory targetFactory,
        IRollbackSettings settings,
        IStoragePathProvider paths,
        ILogger<RollbackService> logger)
    {
        _unitOfWork = unitOfWork;
        _manifestService = manifestService;
        _targetFactory = targetFactory;
        _settings = settings;
        _paths = paths;
        _logger = logger;
    }

    public async Task ExecuteRollbackAsync(Guid rollbackExecutionId, CancellationToken cancellationToken = default)
    {
        var execution = await _unitOfWork.Repository<RollbackExecution>()
            .GetByIdAsync(rollbackExecutionId, cancellationToken);

        if (execution is null)
            throw new InvalidOperationException($"Rollback execution {rollbackExecutionId} not found.");

        var originalJob = await _unitOfWork.Repository<DeployJob>()
            .GetByIdAsync(execution.OriginalExecutionId, cancellationToken);

        if (originalJob is null)
        {
            await FailExecution(execution, "Original deploy job not found.", cancellationToken);
            return;
        }

        var site = await _unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(originalJob.SiteId, cancellationToken);

        if (site is null)
        {
            await FailExecution(execution, "Site not found.", cancellationToken);
            return;
        }

        execution.Status = RollbackStatus.InProgress;
        execution.StartedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var manifest = await _manifestService.GetManifestAsync(originalJob, cancellationToken);

        if (manifest.Count == 0)
        {
            await FailExecution(execution, "No backup manifest found. Cannot perform rollback.", cancellationToken);
            return;
        }

        var target = _targetFactory.CreateForSite(site);
        var backupRoot = GetBackupPath(originalJob);

        var details = new List<RollbackExecutionDetail>();
        var restoreCount = 0;
        var deleteCount = 0;
        var skipCount = 0;
        var failCount = 0;

        var restoreEntries = new List<(BackupManifestEntry Entry, string BackupFullPath)>();

        foreach (var entry in manifest)
        {
            var backupFullPath = Path.Combine(backupRoot, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));

            if (entry.ExistedBeforeDeploy)
            {
                if (File.Exists(backupFullPath))
                    restoreEntries.Add((entry, backupFullPath));
                else
                {
                    details.Add(new RollbackExecutionDetail
                    {
                        RollbackExecutionId = execution.Id,
                        RelativePath = entry.RelativePath,
                        OriginalTargetFile = entry.SourceFilePath,
                        BackupFile = entry.BackupFilePath,
                        Action = entry.Action,
                        Status = RollbackDetailStatus.Skipped,
                        Message = "Archivo de respaldo no encontrado."
                    });
                    skipCount++;
                }
            }
        }

        if (restoreEntries.Count > 0)
        {
            try
            {
                var backupEntries = restoreEntries.Select(r => new BackupEntry(r.Entry.RelativePath, r.Entry.SourceFilePath)).ToList();
                await target.RollbackAsync(originalJob, backupEntries, backupRoot, cancellationToken);

                foreach (var (entry, _) in restoreEntries)
                {
                    details.Add(new RollbackExecutionDetail
                    {
                        RollbackExecutionId = execution.Id,
                        RelativePath = entry.RelativePath,
                        OriginalTargetFile = entry.SourceFilePath,
                        BackupFile = entry.BackupFilePath,
                        Action = entry.Action,
                        Status = RollbackDetailStatus.Restored,
                        Message = "Archivo restaurado correctamente."
                    });
                    restoreCount++;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Batch restore failed during rollback {Id}", execution.Id);
                foreach (var (entry, _) in restoreEntries)
                {
                    details.Add(new RollbackExecutionDetail
                    {
                        RollbackExecutionId = execution.Id,
                        RelativePath = entry.RelativePath,
                        OriginalTargetFile = entry.SourceFilePath,
                        BackupFile = entry.BackupFilePath,
                        Action = entry.Action,
                        Status = RollbackDetailStatus.Failed,
                        Message = $"Error en restauración por lote: {ex.Message}"
                    });
                    failCount++;
                }
            }
        }

        foreach (var entry in manifest.Where(f => f.CreatedByDeploy && !f.ExistedBeforeDeploy))
        {
            if (cancellationToken.IsCancellationRequested)
            {
                execution.Status = RollbackStatus.Cancelled;
                break;
            }

            if (!_settings.DeleteFilesCreatedByDeploy)
            {
                details.Add(new RollbackExecutionDetail
                {
                    RollbackExecutionId = execution.Id,
                    RelativePath = entry.RelativePath,
                    OriginalTargetFile = entry.SourceFilePath,
                    BackupFile = entry.BackupFilePath,
                    Action = entry.Action,
                    Status = RollbackDetailStatus.Skipped,
                    Message = "Eliminación omitida por configuración."
                });
                skipCount++;
                continue;
            }

            try
            {
                var exists = await target.ExistsAsync(entry.SourceFilePath, cancellationToken);
                if (exists)
                {
                    await target.DeleteAsync(entry.SourceFilePath, cancellationToken);
                    details.Add(new RollbackExecutionDetail
                    {
                        RollbackExecutionId = execution.Id,
                        RelativePath = entry.RelativePath,
                        OriginalTargetFile = entry.SourceFilePath,
                        BackupFile = entry.BackupFilePath,
                        Action = entry.Action,
                        Status = RollbackDetailStatus.Deleted,
                        Message = "Archivo eliminado (creado por el despliegue)."
                    });
                    deleteCount++;
                }
                else
                {
                    details.Add(new RollbackExecutionDetail
                    {
                        RollbackExecutionId = execution.Id,
                        RelativePath = entry.RelativePath,
                        OriginalTargetFile = entry.SourceFilePath,
                        BackupFile = entry.BackupFilePath,
                        Action = entry.Action,
                        Status = RollbackDetailStatus.Skipped,
                        Message = "Archivo no existe en el destino."
                    });
                    skipCount++;
                }
            }
            catch (NotSupportedException)
            {
                _logger.LogWarning("Delete not supported for this target type. Skipping {Path}", entry.SourceFilePath);
                details.Add(new RollbackExecutionDetail
                {
                    RollbackExecutionId = execution.Id,
                    RelativePath = entry.RelativePath,
                    OriginalTargetFile = entry.SourceFilePath,
                    BackupFile = entry.BackupFilePath,
                    Action = entry.Action,
                    Status = RollbackDetailStatus.Skipped,
                    Message = "Eliminación no soportada para este tipo de destino."
                });
                skipCount++;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete file {Path}", entry.SourceFilePath);
                details.Add(new RollbackExecutionDetail
                {
                    RollbackExecutionId = execution.Id,
                    RelativePath = entry.RelativePath,
                    OriginalTargetFile = entry.SourceFilePath,
                    BackupFile = entry.BackupFilePath,
                    Action = entry.Action,
                    Status = RollbackDetailStatus.Failed,
                    Message = $"Error: {ex.Message}"
                });
                failCount++;
            }
        }

        foreach (var detail in details)
            await _unitOfWork.Repository<RollbackExecutionDetail>().AddAsync(detail, cancellationToken);

        execution.FinishedAt = DateTime.UtcNow;

        if (failCount > 0 && restoreCount == 0)
        {
            execution.Status = RollbackStatus.Failed;
            execution.ErrorMessage = $"Rollback failed: {failCount} files had errors.";
        }
        else if (failCount > 0)
        {
            execution.Status = RollbackStatus.PartiallyCompleted;
            execution.ErrorMessage = $"Partial rollback: {restoreCount} restored, {deleteCount} deleted, {skipCount} skipped, {failCount} failed.";
        }
        else if (execution.Status != RollbackStatus.Cancelled)
        {
            execution.Status = RollbackStatus.Completed;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Rollback {Id} completed with status {Status}: {Restore} restored, {Delete} deleted, {Skip} skipped, {Fail} failed",
            execution.Id, execution.Status, restoreCount, deleteCount, skipCount, failCount);
    }

    private string GetBackupPath(DeployJob job)
    {
        return _paths.GetRollbackRoot(job.Id);
    }

    private async Task FailExecution(RollbackExecution execution, string error, CancellationToken cancellationToken)
    {
        execution.Status = RollbackStatus.Failed;
        execution.ErrorMessage = error;
        execution.FinishedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        _logger.LogError("Rollback {Id} failed: {Error}", execution.Id, error);
    }
}
