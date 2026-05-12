using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class DeploySite : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid EnvironmentId { get; set; }
    public string PhysicalPath { get; set; } = string.Empty;
    public string? BackupPath { get; set; }
    public bool IsActive { get; set; } = true;
    public DeployEnvironment? Environment { get; set; }
}
