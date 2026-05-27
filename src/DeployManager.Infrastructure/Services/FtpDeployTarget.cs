using Microsoft.Extensions.Logging;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;
using FluentFTP;

namespace DeployManager.Infrastructure.Services;

public class FtpDeployTarget : IDeployTarget
{
    private readonly ILogger<FtpDeployTarget> _logger;
    private readonly IUnitOfWork _unitOfWork;

    public FtpDeployTarget(ILogger<FtpDeployTarget> logger, IUnitOfWork unitOfWork)
    {
        _logger = logger;
        _unitOfWork = unitOfWork;
    }

    public DeployTargetType TargetType => DeployTargetType.FTPS;

    public async Task<string> BackupAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, CancellationToken cancellationToken)
    {
        var date = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
        var backupRoot = Path.Combine(Path.GetTempPath(), "DeployManager", "respaldo", $"respaldo_{date}");
        Directory.CreateDirectory(backupRoot);

        if (entries.Count == 0)
            return backupRoot;

        var (client, _) = await ConnectAsync(job.SiteId, cancellationToken);
        try
        {
            var count = 0;
            foreach (var entry in entries)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var remotePath = StripServerUrl(entry.SourceFullPath);
                var backupPath = Path.Combine(backupRoot, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));
                var backupDir = Path.GetDirectoryName(backupPath)!;
                Directory.CreateDirectory(backupDir);

                try
                {
                    var status = await client.DownloadFile(backupPath, remotePath, FtpLocalExists.Overwrite, FtpVerify.None, token: cancellationToken);
                    if (status == FtpStatus.Failed)
                    {
                        _logger.LogDebug("Remote file not found (skipping backup): {Remote}", remotePath);
                        continue;
                    }
                    count++;
                    _logger.LogDebug("FTP backed up {Remote} -> {Local}", remotePath, backupPath);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogDebug(ex, "Remote file download failed (skipping backup): {Remote}", remotePath);
                }
            }
            if (count > 0)
                await Log(job.Id, "Info", $"Respaldo remoto: {count} archivos respaldados en {backupRoot}", cancellationToken);
            _logger.LogInformation("FTP backup completed for job {JobId}: {Count} files to {Root}", job.Id, count, backupRoot);
        }
        finally
        {
            await client.Disconnect(cancellationToken);
            client.Dispose();
        }

        return backupRoot;
    }

    public async Task DeployAsync(DeployJob job, IReadOnlyList<DeployEntry> entries, CancellationToken cancellationToken)
    {
        if (entries.Count == 0) return;

        var (client, _) = await ConnectAsync(job.SiteId, cancellationToken);
        try
        {
            var uniqueDirs = entries
                .Select(e => GetRemoteDirectory(StripServerUrl(e.DestinationFullPath)))
                .Distinct()
                .ToList();

            await Log(job.Id, "Info", $"Creando {uniqueDirs.Count} directorios remotos...", cancellationToken);

            foreach (var dir in uniqueDirs)
            {
                if (cancellationToken.IsCancellationRequested) break;
                await client.CreateDirectory(dir, cancellationToken);
            }

            var fileCount = 0;
            var logBatch = 0;
            var lastFile = "";
            foreach (var entry in entries)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var relativePath = entry.RelativePath;
                var remotePath = StripServerUrl(entry.DestinationFullPath);

                if (entry.Action == "copy_if_not_exists")
                {
                    try
                    {
                        var exists = await client.FileExists(remotePath, cancellationToken);
                        if (exists) continue;
                    }
                    catch
                    {
                    }
                }

                await client.UploadFile(entry.ExtractedFullPath, remotePath, FtpRemoteExists.Overwrite, false, FtpVerify.None, token: cancellationToken);
                fileCount++;
                logBatch++;
                lastFile = relativePath;

                if (logBatch >= 10)
                {
                    await Log(job.Id, "Info", $"Copiado {fileCount}/{entries.Count}: {lastFile}", cancellationToken);
                    logBatch = 0;
                }

                _logger.LogDebug("FTP deployed {Local} -> {Remote}", entry.ExtractedFullPath, remotePath);
            }

            if (logBatch > 0)
                await Log(job.Id, "Info", $"Copiado {fileCount}/{entries.Count}: {lastFile}", cancellationToken);

            await Log(job.Id, "Info", $"Despliegue completado: {fileCount} archivos copiados.", cancellationToken);
        }
        finally
        {
            await client.Disconnect(cancellationToken);
            client.Dispose();
        }
    }

    public async Task RollbackAsync(DeployJob job, IReadOnlyList<BackupEntry> entries, string backupRoot, CancellationToken cancellationToken)
    {
        if (entries.Count == 0) return;

        var (client, _) = await ConnectAsync(job.SiteId, cancellationToken);
        try
        {
            var uniqueDirs = entries
                .Select(e => GetRemoteDirectory(StripServerUrl(e.SourceFullPath)))
                .Distinct()
                .ToList();

            foreach (var dir in uniqueDirs)
            {
                if (cancellationToken.IsCancellationRequested) break;
                await client.CreateDirectory(dir, cancellationToken);
            }

            var count = 0;
            foreach (var entry in entries)
            {
                if (cancellationToken.IsCancellationRequested) break;

                var backupPath = Path.Combine(backupRoot, entry.RelativePath.Replace('/', Path.DirectorySeparatorChar));
                if (!File.Exists(backupPath)) continue;

                var remotePath = StripServerUrl(entry.SourceFullPath);
                await client.UploadFile(backupPath, remotePath, FtpRemoteExists.Overwrite, false, FtpVerify.None, token: cancellationToken);
                count++;
                _logger.LogDebug("FTP rolled back {Backup} -> {Remote}", backupPath, remotePath);
            }

            if (count > 0)
                await Log(job.Id, "Info", $"Rollback completado: {count} archivos restaurados.", cancellationToken);
        }
        finally
        {
            await client.Disconnect(cancellationToken);
            client.Dispose();
        }
    }

    private async Task Log(Guid jobId, string level, string message, CancellationToken cancellationToken)
    {
        var log = new DeployLog
        {
            DeployJobId = jobId,
            Level = level,
            Message = message,
        };
        await _unitOfWork.Repository<DeployLog>().AddAsync(log, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task<(AsyncFtpClient client, string remoteBasePath)> ConnectAsync(Guid siteId, CancellationToken cancellationToken)
    {
        var site = await _unitOfWork.Repository<DeploySite>().GetByIdAsync(siteId, cancellationToken);
        if (site is null)
            throw new InvalidOperationException($"Site {siteId} not found.");

        var rootPath = site.RootPath ?? string.Empty;
        var publicUrl = site.PublicUrl ?? string.Empty;

        string serverUrl;
        string remoteBasePath;

        if (rootPath.StartsWith("ftp://", StringComparison.OrdinalIgnoreCase) ||
            rootPath.StartsWith("ftps://", StringComparison.OrdinalIgnoreCase))
        {
            var uri = new Uri(rootPath);
            serverUrl = $"{uri.Scheme}://{uri.Host}";
            if (uri.Port > 0 && uri.Port != (uri.Scheme == "ftps" ? 990 : 21))
                serverUrl += $":{uri.Port}";
            remoteBasePath = uri.AbsolutePath.TrimEnd('/');
            if (string.IsNullOrEmpty(remoteBasePath))
                remoteBasePath = "/";
        }
        else
        {
            serverUrl = publicUrl;
            remoteBasePath = "/" + rootPath.Trim('/').Replace('\\', '/').TrimStart('/');
            if (remoteBasePath.Length <= 1)
                remoteBasePath = "/";
        }

        if (string.IsNullOrWhiteSpace(serverUrl))
            throw new InvalidOperationException(
                $"FTP server URL not found. Set PublicUrl (e.g. ftps://server.com) or include it in RootPath for FTPS site '{site.Code}'.");

        var svcUri = new Uri(serverUrl.StartsWith("ftp", StringComparison.OrdinalIgnoreCase)
            ? serverUrl
            : $"ftp://{serverUrl.TrimStart('/')}");

        var host = svcUri.Host;
        var port = svcUri.Port > 0 ? svcUri.Port : 21;
        var username = site.Username ?? string.Empty;
        var password = site.PasswordEncrypted ?? string.Empty;

        var client = new AsyncFtpClient(host, username, password, port);
        client.Config.EncryptionMode = FtpEncryptionMode.Auto;
        client.Config.ValidateAnyCertificate = true;
        client.Config.ValidateCertificateRevocation = false;
        client.Config.ConnectTimeout = 15_000;
        client.Config.ReadTimeout = 600_000;

        try
        {
            await client.Connect(cancellationToken);
            _logger.LogDebug("Connected to FTP server {Host}:{Port}, base path: {BasePath}", host, port, remoteBasePath);
            return (client, remoteBasePath);
        }
        catch (Exception) when (port == 21 && !cancellationToken.IsCancellationRequested)
        {
            _logger.LogDebug("Explicit FTPS on port 21 failed, trying Implicit FTPS on port 990");
            client.Dispose();
        }

        client = new AsyncFtpClient(host, username, password, 990);
        client.Config.EncryptionMode = FtpEncryptionMode.Implicit;
        client.Config.ValidateAnyCertificate = true;
        client.Config.ValidateCertificateRevocation = false;
        client.Config.ConnectTimeout = 15_000;
        client.Config.ReadTimeout = 600_000;

        await client.Connect(cancellationToken);
        _logger.LogDebug("Connected via Implicit FTPS on port 990 to {Host}", host);
        return (client, remoteBasePath);
    }

    private static string StripServerUrl(string path)
    {
        var normalized = path.Replace('\\', '/');
        var idx = normalized.IndexOf("://", StringComparison.Ordinal);
        if (idx >= 0)
        {
            var slashAfterHost = normalized.IndexOf('/', idx + 3);
            if (slashAfterHost >= 0)
                normalized = normalized[slashAfterHost..];
            else
                normalized = "/";
        }
        return normalized;
    }

    private static string GetRemoteDirectory(string remotePath)
    {
        var dir = remotePath.Contains('/')
            ? remotePath[..remotePath.LastIndexOf('/')]
            : "/";
        return string.IsNullOrEmpty(dir) ? "/" : dir;
    }
}
