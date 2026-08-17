using DeployManager.Domain.Common;
using DeployManager.Domain.Enums;

namespace DeployManager.Domain.Entities;

public class RollbackExecutionDetail : BaseEntity
{
    public Guid RollbackExecutionId { get; set; }
    public string RelativePath { get; set; } = string.Empty;
    public string? OriginalTargetFile { get; set; }
    public string? BackupFile { get; set; }
    public string Action { get; set; } = string.Empty;
    public RollbackDetailStatus Status { get; set; } = RollbackDetailStatus.Pending;
    public string? Message { get; set; }

    public RollbackExecution? RollbackExecution { get; set; }
}
