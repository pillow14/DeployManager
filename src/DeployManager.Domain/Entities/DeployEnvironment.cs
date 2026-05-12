using DeployManager.Domain.Common;
using DeployManager.Domain.Enums;

namespace DeployManager.Domain.Entities;

public class DeployEnvironment : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DeployTargetType TargetType { get; set; }
    public string TargetUrl { get; set; } = string.Empty;
    public string? CredentialKey { get; set; }
    public bool IsActive { get; set; } = true;
}
