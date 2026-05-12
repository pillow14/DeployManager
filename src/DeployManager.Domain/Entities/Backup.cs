using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class Backup : BaseEntity
{
    public Guid DeployJobId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public bool IsRestored { get; set; }
    public DeployJob? DeployJob { get; set; }
}
