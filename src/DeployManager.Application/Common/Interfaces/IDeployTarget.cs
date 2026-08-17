using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;

namespace DeployManager.Application.Common.Interfaces;

public interface IDeployTarget
{
    DeployTargetType TargetType { get; }
    Task<string> BackupAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, CancellationToken cancellationToken);
    Task DeployAsync(DeployJob job, IReadOnlyList<DeployEntry> entries, CancellationToken cancellationToken);
    Task RollbackAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, string backupRoot, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(string path, CancellationToken cancellationToken = default);
    Task UploadAsync(string localPath, string targetPath, CancellationToken cancellationToken = default);
    Task DownloadAsync(string targetPath, string localPath, CancellationToken cancellationToken = default);
    Task DeleteAsync(string path, CancellationToken cancellationToken = default);
    Task CreateDirectoryAsync(string path, CancellationToken cancellationToken = default);
    Task<List<string>> ListFilesAsync(string directory, CancellationToken cancellationToken = default);
}

public record BackupEntry(string RelativePath, string SourceFullPath);
public record DeployEntry(string RelativePath, string ExtractedFullPath, string DestinationFullPath, string Action);
