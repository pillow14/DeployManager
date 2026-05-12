using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class DeployLog : BaseEntity
{
    public Guid DeployJobId { get; set; }
    public string Level { get; set; } = "Info";
    public string Message { get; set; } = string.Empty;
    public DeployJob? DeployJob { get; set; }
}
