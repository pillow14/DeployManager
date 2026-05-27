using DeployManager.Domain.Common;

namespace DeployManager.Domain.Entities;

public class DeployPackage : BaseEntity
{
    public Guid? SiteId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string StoredPath { get; set; } = string.Empty;
    public string Status { get; set; } = "Uploaded";
    public DeploySite? Site { get; set; }
}
