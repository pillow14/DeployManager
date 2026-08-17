namespace DeployManager.Domain.Enums;

public enum RollbackStatus
{
    Pending,
    InProgress,
    Completed,
    Failed,
    PartiallyCompleted,
    Cancelled
}
