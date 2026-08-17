namespace DeployManager.Application.Common.Interfaces;

public interface IRollbackSettings
{
    bool DeleteFilesCreatedByDeploy { get; }
    bool AllowPartialRollback { get; }
    bool BackupBeforeRollback { get; }
}
