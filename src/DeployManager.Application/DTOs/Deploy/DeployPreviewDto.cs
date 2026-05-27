namespace DeployManager.Application.DTOs.Deploy;

public class DeployPreviewDto
{
    public Guid PackageId { get; set; }
    public Guid SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public List<DeployFilePreviewDto> Files { get; set; } = [];
    public DeploySummaryDto Summary { get; set; } = new();
}

public class DeployFilePreviewDto
{
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? MatchedRule { get; set; }
    public string? MatchedRuleName { get; set; }
}

public class DeploySummaryDto
{
    public int TotalFiles { get; set; }
    public int ToCopy { get; set; }
    public int ToOmit { get; set; }
    public int ToBackup { get; set; }
    public int ToDelete { get; set; }
}
