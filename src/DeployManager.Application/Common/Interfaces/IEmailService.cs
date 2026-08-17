namespace DeployManager.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendDeployStartNotificationAsync(string siteName, string packageName, List<string> recipients, string triggeredBy, CancellationToken cancellationToken = default);
    Task SendDeployResultNotificationAsync(string siteName, string packageName, string status, string? duration, string? errorMessage, int fileCount, List<string> recipients, CancellationToken cancellationToken = default);
}
