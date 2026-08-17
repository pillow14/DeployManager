namespace DeployManager.Application.DTOs.Rollback;

public class RollbackPreviewDto
{
    public Guid OriginalDeployJobId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public string EnvironmentName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public DateTime DeployedAt { get; set; }
    public string BackupPath { get; set; } = string.Empty;
    public int TotalFiles { get; set; }
    public int FilesToRestore { get; set; }
    public int FilesToDelete { get; set; }
    public long TotalSizeBytes { get; set; }
    public List<RollbackPreviewFileDto> Files { get; set; } = new();
}

public class RollbackPreviewFileDto
{
    public string RelativePath { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public bool ExistedBeforeDeploy { get; set; }
    public bool CreatedByDeploy { get; set; }
    public string Action { get; set; } = string.Empty;
    public string WillBe { get; set; } = string.Empty;
}
