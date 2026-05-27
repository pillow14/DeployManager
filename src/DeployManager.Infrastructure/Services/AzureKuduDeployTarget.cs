using System.Net;
using System.Net.Http.Headers;
using System.Text;
using Microsoft.Extensions.Logging;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Infrastructure.Services;

public class AzureKuduDeployTarget : IDeployTarget
{
    private static readonly HttpClient _httpClient = new();

    private readonly ILogger<AzureKuduDeployTarget> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public AzureKuduDeployTarget(ILogger<AzureKuduDeployTarget> logger, IUnitOfWork unitOfWork)
    {
        _logger = logger;
        _unitOfWork = unitOfWork;
    }

    public DeployTargetType TargetType => DeployTargetType.AzureAppService;

    public async Task<string> BackupAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, CancellationToken cancellationToken)
    {
        var backupRoot = Path.Combine(Path.GetTempPath(), "DeployManager", "backups", job.Id.ToString());
        Directory.CreateDirectory(backupRoot);

        if (entries.Count == 0)
            return backupRoot;

        var (baseUrl, authHeader) = await GetConnectionInfo(job.SiteId, cancellationToken);

        foreach (var entry in entries)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var remotePath = NormalizeRemotePath(entry.SourceFullPath);
            var requestUri = $"{baseUrl}/api/vfs{remotePath}";
            var backupPath = Path.Combine(backupRoot, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));
            var backupDir = Path.GetDirectoryName(backupPath)!;
            Directory.CreateDirectory(backupDir);

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
                request.Headers.Authorization = authHeader;

                using var response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseContentRead, cancellationToken);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    _logger.LogDebug("Kudu file not found (skipping backup): {Path}", remotePath);
                    continue;
                }

                response.EnsureSuccessStatusCode();

                await using var fileStream = new FileStream(backupPath, FileMode.Create, FileAccess.Write, FileShare.None, 65536, useAsync: true);
                await response.Content.CopyToAsync(fileStream, cancellationToken);
                _logger.LogDebug("Kudu backed up {Remote} -> {Local}", remotePath, backupPath);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Failed to backup remote file (skipping): {Remote}", remotePath);
            }
        }

        _logger.LogInformation("Kudu backup completed for job {JobId}: {Count} files", job.Id, entries.Count);
        return backupRoot;
    }

    public async Task DeployAsync(DeployJob job, IReadOnlyList<DeployEntry> entries, CancellationToken cancellationToken)
    {
        if (entries.Count == 0) return;

        var (baseUrl, authHeader) = await GetConnectionInfo(job.SiteId, cancellationToken);

        foreach (var entry in entries)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var remotePath = NormalizeRemotePath(entry.DestinationFullPath);
            var requestUri = $"{baseUrl}/api/vfs{remotePath}";

            if (entry.Action == "copy_if_not_exists")
            {
                using var checkRequest = new HttpRequestMessage(HttpMethod.Get, requestUri);
                checkRequest.Headers.Authorization = authHeader;

                using var checkResponse = await _httpClient.SendAsync(checkRequest, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (checkResponse.IsSuccessStatusCode)
                    continue;
            }

            var fileBytes = await File.ReadAllBytesAsync(entry.ExtractedFullPath, cancellationToken);

            using var request = new HttpRequestMessage(HttpMethod.Put, requestUri)
            {
                Content = new ByteArrayContent(fileBytes)
            };
            request.Headers.Authorization = authHeader;
            request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (response.StatusCode == HttpStatusCode.Conflict)
            {
                _logger.LogWarning("Kudu conflict (file in use?): {Remote}", remotePath);
            }
            else
            {
                response.EnsureSuccessStatusCode();
            }

            _logger.LogDebug("Kudu deployed {Local} -> {Remote}", entry.ExtractedFullPath, remotePath);
        }
    }

    public async Task RollbackAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, string backupRoot, CancellationToken cancellationToken)
    {
        if (entries.Count == 0) return;

        var (baseUrl, authHeader) = await GetConnectionInfo(job.SiteId, cancellationToken);

        foreach (var entry in entries)
        {
            if (cancellationToken.IsCancellationRequested) break;

            var backupPath = Path.Combine(backupRoot, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));
            if (!File.Exists(backupPath)) continue;

            var remotePath = NormalizeRemotePath(entry.SourceFullPath);
            var requestUri = $"{baseUrl}/api/vfs{remotePath}";

            var fileBytes = await File.ReadAllBytesAsync(backupPath, cancellationToken);

            using var request = new HttpRequestMessage(HttpMethod.Put, requestUri)
            {
                Content = new ByteArrayContent(fileBytes)
            };
            request.Headers.Authorization = authHeader;
            request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            _logger.LogDebug("Kudu rolled back {Backup} -> {Remote}", backupPath, remotePath);
        }
    }

    private async Task<(string baseUrl, AuthenticationHeaderValue authHeader)> GetConnectionInfo(Guid siteId, CancellationToken cancellationToken)
    {
        var site = await _unitOfWork.Repository<DeploySite>().GetByIdAsync(siteId, cancellationToken);
        if (site is null)
            throw new InvalidOperationException($"Site {siteId} not found.");

        var baseUrl = site.PublicUrl;
        if (string.IsNullOrWhiteSpace(baseUrl))
            throw new InvalidOperationException($"PublicUrl must be configured as the Kudu SCM URL for AzureAppService site '{site.Code}'.");

        var username = site.Username ?? string.Empty;
        var password = site.PasswordEncrypted ?? string.Empty;
        var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{username}:{password}"));
        var authHeader = new AuthenticationHeaderValue("Basic", credentials);

        return (baseUrl.TrimEnd('/'), authHeader);
    }

    private static string NormalizeRemotePath(string path)
    {
        return path.Replace('\\', '/');
    }
}
