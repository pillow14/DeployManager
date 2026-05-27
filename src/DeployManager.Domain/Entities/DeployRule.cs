using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class DeployRule : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string SourcePattern { get; set; } = string.Empty;
    public string DestinationPath { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? DeployRuleSetId { get; set; }
    public DeployRuleSet? DeployRuleSet { get; set; }
}
