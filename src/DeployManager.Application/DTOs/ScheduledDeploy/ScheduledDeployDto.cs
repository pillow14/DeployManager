namespace DeployManager.Application.DTOs.ScheduledDeploy;

public class ScheduledDeployDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public string? PackageFileName { get; set; }
    public DateTime ScheduledAt { get; set; }
    public string Status { get; set; } = string.Empty;
    public string CreatedByUserName { get; set; } = string.Empty;
    public List<string> Recipients { get; set; } = new();
    public bool NotifyOnStart { get; set; }
    public bool NotifyOnComplete { get; set; }
    public DateTime CreatedAt { get; set; }
}
