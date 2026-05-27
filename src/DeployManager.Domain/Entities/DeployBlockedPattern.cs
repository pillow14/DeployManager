using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class DeployBlockedPattern : BaseEntity
{
    public string Pattern { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}
