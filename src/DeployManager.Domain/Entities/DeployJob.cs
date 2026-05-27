using DeployManager.Domain.Common;
using DeployManager.Domain.Enums;

namespace DeployManager.Domain.Entities;

public class DeployJob : BaseEntity
{
    public Guid SiteId { get; set; }
    public Guid? PackageId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public DeployStatus Status { get; set; } = DeployStatus.Pending;
    public string? LogSummary { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? CreatedByUserId { get; set; }
    public DeploySite? Site { get; set; }
    public DeployPackage? Package { get; set; }
    public User? CreatedByUser { get; set; }
    public ICollection<DeployLog> Logs { get; set; } = new List<DeployLog>();
    public ICollection<Backup> Backups { get; set; } = new List<Backup>();
}
