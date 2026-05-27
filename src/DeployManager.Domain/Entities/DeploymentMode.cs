using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class DeploymentMode : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<DeployRuleSet> RuleSets { get; set; } = new List<DeployRuleSet>();
}
