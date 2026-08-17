using Microsoft.Extensions.Options;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.Common.Options;

namespace DeployManager.Infrastructure.Services;

public class StoragePathProvider : IStoragePathProvider
{
    private readonly string _basePath;

    public StoragePathProvider(IOptions<StorageOptions> options)
    {
        var configured = options.Value.BasePath?.Trim();
        _basePath = string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(Path.GetTempPath(), "DeployManager")
            : Path.Combine(Path.GetFullPath(configured), "DeployManager");
        Directory.CreateDirectory(_basePath);
    }

    public string BasePath => _basePath;

    public string GetPackagesPath(Guid packageId)
        => Path.Combine(_basePath, "packages", packageId.ToString());

    public string GetBackupsRoot(Guid jobId)
        => Path.Combine(_basePath, "backups", jobId.ToString());

    public string GetRollbackRoot(Guid jobId)
        => Path.Combine(_basePath, "respaldos", $"job_{jobId}");

    public string GetRespaldoRoot()
        => Path.Combine(_basePath, "respaldo");

    public string GetBackupZipsDir()
        => Path.Combine(_basePath, "backup-zips");

    public string GetBackupZipPath(Guid jobId)
        => Path.Combine(GetBackupZipsDir(), $"{jobId}.zip");

    public string GetManifestPath(Guid jobId)
        => Path.Combine(GetRollbackRoot(jobId), "backup-manifest.json");
}
