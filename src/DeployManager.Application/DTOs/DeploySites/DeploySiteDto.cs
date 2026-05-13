namespace DeployManager.Application.DTOs.DeploySites;

public class DeploySiteDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid EnvironmentId { get; set; }
    public string EnvironmentName { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public string RootPath { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }
    public string? Username { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
