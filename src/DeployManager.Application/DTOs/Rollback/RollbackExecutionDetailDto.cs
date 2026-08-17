namespace DeployManager.Application.DTOs.Rollback;

public class RollbackExecutionDetailDto
{
    public Guid Id { get; set; }
    public string RelativePath { get; set; } = string.Empty;
    public string? OriginalTargetFile { get; set; }
    public string? BackupFile { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Message { get; set; }
}
