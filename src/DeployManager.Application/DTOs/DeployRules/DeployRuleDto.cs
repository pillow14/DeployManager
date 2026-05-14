namespace DeployManager.Application.DTOs.DeployRules;

public class DeployRuleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SourcePattern { get; set; } = string.Empty;
    public string DestinationPath { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
