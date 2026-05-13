using DeployManager.Domain.Common;
using DeployManager.Domain.Enums;

namespace DeployManager.Domain.Entities;

public class DeploySite : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid EnvironmentId { get; set; }
    public DeployTargetType TargetType { get; set; }
    public string RootPath { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }
    public string? Username { get; set; }
    public string? PasswordEncrypted { get; set; }
    public bool IsActive { get; set; } = true;
    public DeployEnvironment? Environment { get; set; }
}
