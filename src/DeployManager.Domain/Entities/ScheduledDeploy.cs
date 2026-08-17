using DeployManager.Domain.Common;
using DeployManager.Domain.Enums;

namespace DeployManager.Domain.Entities;

public class ScheduledDeploy : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid SiteId { get; set; }
    public Guid? PackageId { get; set; }
    public DateTime ScheduledAt { get; set; }
    public ScheduledDeployStatus Status { get; set; } = ScheduledDeployStatus.Pending;
    public Guid CreatedByUserId { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? JobId { get; set; }
    public string? ErrorMessage { get; set; }
    public string Recipients { get; set; } = "[]";
    public bool NotifyOnStart { get; set; } = true;
    public bool NotifyOnComplete { get; set; } = true;

    public DeploySite? Site { get; set; }
    public DeployPackage? Package { get; set; }
    public User? CreatedByUser { get; set; }
    public DeployJob? Job { get; set; }
}
