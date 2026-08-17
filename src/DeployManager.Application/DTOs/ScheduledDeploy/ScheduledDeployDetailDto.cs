namespace DeployManager.Application.DTOs.ScheduledDeploy;

public class ScheduledDeployDetailDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public Guid? PackageId { get; set; }
    public string? PackageFileName { get; set; }
    public DateTime ScheduledAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CreatedByUserName { get; set; } = string.Empty;
    public List<string> Recipients { get; set; } = new();
    public bool NotifyOnStart { get; set; }
    public bool NotifyOnComplete { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public Guid? JobId { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
}
