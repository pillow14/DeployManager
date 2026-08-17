using DeployManager.Domain.Entities;

namespace DeployManager.Application.Common.Interfaces;

public class BackupManifestEntry
{
    public string RelativePath { get; set; } = string.Empty;
    public string SourceFilePath { get; set; } = string.Empty;
    public string BackupFilePath { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public bool ExistedBeforeDeploy { get; set; }
    public bool CreatedByDeploy { get; set; }
    public string Action { get; set; } = string.Empty;
}

public interface IBackupManifestService
{
    Task<List<BackupManifestEntry>> GetManifestAsync(DeployJob job, CancellationToken cancellationToken = default);
    Task SaveManifestAsync(DeployJob job, List<BackupManifestEntry> entries, CancellationToken cancellationToken = default);
    Task DeleteManifestAsync(DeployJob job, CancellationToken cancellationToken = default);
}
