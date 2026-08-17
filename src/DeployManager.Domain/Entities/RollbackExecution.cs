using DeployManager.Domain.Common;
using DeployManager.Domain.Enums;

namespace DeployManager.Domain.Entities;

public class RollbackExecution : BaseEntity
{
    public Guid OriginalExecutionId { get; set; }
    public Guid SiteId { get; set; }
    public RollbackStatus Status { get; set; } = RollbackStatus.Pending;
    public Guid? ExecutedByUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string? ErrorMessage { get; set; }

    public DeployJob? OriginalExecution { get; set; }
    public DeploySite? Site { get; set; }
    public User? ExecutedByUser { get; set; }
    public ICollection<RollbackExecutionDetail> Details { get; set; } = new List<RollbackExecutionDetail>();
}
