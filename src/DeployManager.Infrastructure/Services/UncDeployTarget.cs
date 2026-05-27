using Microsoft.Extensions.Logging;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;

namespace DeployManager.Infrastructure.Services;

public class UncDeployTarget : IDeployTarget
{
    private readonly ILogger<UncDeployTarget> _logger;

    public UncDeployTarget(ILogger<UncDeployTarget> logger)
    {
        _logger = logger;
    }

    public DeployTargetType TargetType => DeployTargetType.UNC;

    public Task<string> BackupAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, CancellationToken cancellationToken)
    {
        var backupRoot = Path.Combine(Path.GetTempPath(), "DeployManager", "backups", job.Id.ToString());
        Directory.CreateDirectory(backupRoot);

        foreach (var entry in entries)
        {
            if (cancellationToken.IsCancellationRequested) break;

            if (!File.Exists(entry.SourceFullPath))
            {
                _logger.LogDebug("UNC file not found (skipping backup): {Source}", entry.SourceFullPath);
                continue;
            }

            var backupPath = Path.Combine(backupRoot, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));
            var backupDir = Path.GetDirectoryName(backupPath)!;
            Directory.CreateDirectory(backupDir);

            File.Copy(entry.SourceFullPath, backupPath, overwrite: true);
            _logger.LogDebug("Backed up {Source} -> {Dest}", entry.SourceFullPath, backupPath);
        }

        _logger.LogInformation("UNC backup completed for job {JobId}: {Count} files", job.Id, entries.Count);
        return Task.FromResult(backupRoot);
    }

    public async Task DeployAsync(DeployJob job, IReadOnlyList<DeployEntry> entries, CancellationToken cancellationToken)
    {
        foreach (var entry in entries)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var destDir = Path.GetDirectoryName(entry.DestinationFullPath)!;
            Directory.CreateDirectory(destDir);

            if (entry.Action == "copy_if_not_exists" && File.Exists(entry.DestinationFullPath))
                continue;

            await CopyFileAsync(entry.ExtractedFullPath, entry.DestinationFullPath, cancellationToken);
            _logger.LogDebug("UNC deployed {Source} -> {Dest}", entry.ExtractedFullPath, entry.DestinationFullPath);
        }
    }

    public async Task RollbackAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, string backupRoot, CancellationToken cancellationToken)
    {
        foreach (var entry in entries)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var backupPath = Path.Combine(backupRoot, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(backupPath)) continue;

            var destDir = Path.GetDirectoryName(entry.SourceFullPath)!;
            Directory.CreateDirectory(destDir);

            await CopyFileAsync(backupPath, entry.SourceFullPath, cancellationToken);
            _logger.LogDebug("UNC rolled back {Backup} -> {Dest}", backupPath, entry.SourceFullPath);
        }
    }

    private static async Task CopyFileAsync(string source, string dest, CancellationToken cancellationToken)
    {
        await using var sourceStream = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.Read, 65536, useAsync: true);
        await using var destStream = new FileStream(dest, FileMode.Create, FileAccess.Write, FileShare.None, 65536, useAsync: true);
        await sourceStream.CopyToAsync(destStream, cancellationToken);
    }
}
