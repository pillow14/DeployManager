using System.Text.Json;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Services;

public class BackupManifestService : IBackupManifestService
{
    private const string ManifestFileName = "backup-manifest.json";
    private readonly IStoragePathProvider _paths;

    public BackupManifestService(IStoragePathProvider paths)
    {
        _paths = paths;
    }

    public Task<List<BackupManifestEntry>> GetManifestAsync(DeployJob job, CancellationToken cancellationToken = default)
    {
        var manifestPath = GetManifestPath(job);
        if (!File.Exists(manifestPath))
            return Task.FromResult(new List<BackupManifestEntry>());

        var json = File.ReadAllText(manifestPath);
        var entries = JsonSerializer.Deserialize<List<BackupManifestEntry>>(json);
        return Task.FromResult(entries ?? new List<BackupManifestEntry>());
    }

    public Task SaveManifestAsync(DeployJob job, List<BackupManifestEntry> entries, CancellationToken cancellationToken = default)
    {
        var manifestPath = GetManifestPath(job);
        var dir = Path.GetDirectoryName(manifestPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            Directory.CreateDirectory(dir);

        var json = JsonSerializer.Serialize(entries, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(manifestPath, json);
        return Task.CompletedTask;
    }

    public Task DeleteManifestAsync(DeployJob job, CancellationToken cancellationToken = default)
    {
        var manifestPath = GetManifestPath(job);
        if (File.Exists(manifestPath))
            File.Delete(manifestPath);
        return Task.CompletedTask;
    }

    private string GetManifestPath(DeployJob job)
    {
        return Path.Combine(_paths.GetRollbackRoot(job.Id), ManifestFileName);
    }
}
