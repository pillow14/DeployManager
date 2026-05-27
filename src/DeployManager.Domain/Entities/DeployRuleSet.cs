using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class DeployRuleSet : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid DeploymentModeId { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public DeploymentMode? DeploymentMode { get; set; }
    public ICollection<DeployRule> Rules { get; set; } = new List<DeployRule>();
}
