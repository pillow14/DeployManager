using Microsoft.Extensions.Logging;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;

namespace DeployManager.Infrastructure.Services;

public class LocalDeployTarget : IDeployTarget
{
    private readonly ILogger<LocalDeployTarget> _logger;
    private readonly IStoragePathProvider _paths;

    public LocalDeployTarget(ILogger<LocalDeployTarget> logger, IStoragePathProvider paths)
    {
        _logger = logger;
        _paths = paths;
    }

    public DeployTargetType TargetType => DeployTargetType.IIS;

    public Task<string> BackupAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, CancellationToken cancellationToken)
    {
        var backupRoot = _paths.GetBackupsRoot(job.Id);
        Directory.CreateDirectory(backupRoot);

        foreach (var entry in entries)
        {
            if (cancellationToken.IsCancellationRequested) break;

            if (!File.Exists(entry.SourceFullPath))
            {
                _logger.LogDebug("Local file not found (skipping backup): {Source}", entry.SourceFullPath);
                continue;
            }

            var backupPath = Path.Combine(backupRoot, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));
            var backupDir = Path.GetDirectoryName(backupPath)!;
            Directory.CreateDirectory(backupDir);

            File.Copy(entry.SourceFullPath, backupPath, overwrite: true);
            _logger.LogDebug("Backed up {Source} -> {Dest}", entry.SourceFullPath, backupPath);
        }

        _logger.LogInformation("Backup completed for job {JobId}: {Count} files to {Root}", job.Id, entries.Count, backupRoot);
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
            _logger.LogDebug("Deployed {Source} -> {Dest}", entry.ExtractedFullPath, entry.DestinationFullPath);
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
            _logger.LogDebug("Rolled back {Backup} -> {Dest}", backupPath, entry.SourceFullPath);
        }
    }

    public Task<bool> ExistsAsync(string path, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(File.Exists(path) || Directory.Exists(path));
    }

    public async Task UploadAsync(string localPath, string targetPath, CancellationToken cancellationToken = default)
    {
        var destDir = Path.GetDirectoryName(targetPath)!;
        Directory.CreateDirectory(destDir);
        await CopyFileAsync(localPath, targetPath, cancellationToken);
    }

    public async Task DownloadAsync(string targetPath, string localPath, CancellationToken cancellationToken = default)
    {
        var destDir = Path.GetDirectoryName(localPath)!;
        Directory.CreateDirectory(destDir);
        await CopyFileAsync(targetPath, localPath, cancellationToken);
    }

    public Task DeleteAsync(string path, CancellationToken cancellationToken = default)
    {
        if (File.Exists(path))
            File.Delete(path);
        else if (Directory.Exists(path))
            Directory.Delete(path, true);
        return Task.CompletedTask;
    }

    public Task CreateDirectoryAsync(string path, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(path);
        return Task.CompletedTask;
    }

    public Task<List<string>> ListFilesAsync(string directory, CancellationToken cancellationToken = default)
    {
        if (!Directory.Exists(directory))
            return Task.FromResult(new List<string>());

        var files = Directory.GetFiles(directory, "*", SearchOption.AllDirectories).ToList();
        return Task.FromResult(files);
    }

    private static async Task CopyFileAsync(string source, string dest, CancellationToken cancellationToken)
    {
        await using var sourceStream = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.Read, 65536, useAsync: true);
        await using var destStream = new FileStream(dest, FileMode.Create, FileAccess.Write, FileShare.None, 65536, useAsync: true);
        await sourceStream.CopyToAsync(destStream, cancellationToken);
    }
}
