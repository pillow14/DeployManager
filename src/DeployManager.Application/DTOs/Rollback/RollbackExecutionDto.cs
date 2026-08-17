namespace DeployManager.Application.DTOs.Rollback;

public class RollbackExecutionDto
{
    public Guid Id { get; set; }
    public Guid OriginalExecutionId { get; set; }
    public Guid SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public string EnvironmentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ExecutedByUserName { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RollbackExecutionDetailDto> Details { get; set; } = new();
}
