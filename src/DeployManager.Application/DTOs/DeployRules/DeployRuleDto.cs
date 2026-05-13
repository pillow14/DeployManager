namespace DeployManager.Application.DTOs.DeployRules;

public class DeployRuleDto
{
    public Guid Id { get; set; }
    public string Pattern { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
