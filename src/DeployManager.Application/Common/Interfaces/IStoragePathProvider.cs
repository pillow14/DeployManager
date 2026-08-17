namespace DeployManager.Application.Common.Interfaces;

public interface IStoragePathProvider
{
    string BasePath { get; }
    string GetPackagesPath(Guid packageId);
    string GetBackupsRoot(Guid jobId);
    string GetRollbackRoot(Guid jobId);
    string GetRespaldoRoot();
    string GetBackupZipsDir();
    string GetBackupZipPath(Guid jobId);
    string GetManifestPath(Guid jobId);
}
