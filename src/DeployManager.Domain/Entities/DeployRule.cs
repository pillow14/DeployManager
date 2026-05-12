using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class DeployRule : BaseEntity
{
    public string Pattern { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsEnabled { get; set; } = true;
}
