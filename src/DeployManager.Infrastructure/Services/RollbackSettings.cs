using DeployManager.Application.Common.Interfaces;

namespace DeployManager.Infrastructure.Services;

public class RollbackSettings : IRollbackSettings
{
    public bool DeleteFilesCreatedByDeploy { get; }
    public bool AllowPartialRollback { get; }
    public bool BackupBeforeRollback { get; }

    public RollbackSettings(bool deleteFilesCreatedByDeploy = true, bool allowPartialRollback = false, bool backupBeforeRollback = true)
    {
        DeleteFilesCreatedByDeploy = deleteFilesCreatedByDeploy;
        AllowPartialRollback = allowPartialRollback;
        BackupBeforeRollback = backupBeforeRollback;
    }
}
