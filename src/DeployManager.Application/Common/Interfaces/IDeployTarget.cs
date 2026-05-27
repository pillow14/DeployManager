using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;

namespace DeployManager.Application.Common.Interfaces;

public interface IDeployTarget
{
    DeployTargetType TargetType { get; }
    Task<string> BackupAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, CancellationToken cancellationToken);
    Task DeployAsync(DeployJob job, IReadOnlyList<DeployEntry> entries, CancellationToken cancellationToken);
    Task RollbackAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, string backupRoot, CancellationToken cancellationToken);
}

public record BackupEntry(string RelativePath, string SourceFullPath);
public record DeployEntry(string RelativePath, string ExtractedFullPath, string DestinationFullPath, string Action);
