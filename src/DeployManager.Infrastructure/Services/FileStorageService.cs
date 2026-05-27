using System.IO.Compression;
using DeployManager.Application.Common.Interfaces;

namespace DeployManager.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public FileStorageService()
    {
        _basePath = Path.Combine(Path.GetTempPath(), "DeployManager");
        Directory.CreateDirectory(_basePath);
    }

    public string SavePackage(string packageId, string fileName, Stream content)
    {
        var packageDir = Path.Combine(_basePath, "packages", packageId);
        Directory.CreateDirectory(packageDir);

        var filePath = Path.Combine(packageDir, fileName);
        using (var fs = new FileStream(filePath, FileMode.Create, FileAccess.Write))
        {
            content.CopyTo(fs);
        }

        return filePath;
    }

    public string ExtractToDirectory(string storedPath)
    {
        var extractDir = Path.Combine(
            Path.GetDirectoryName(storedPath)!,
            "extracted",
            Path.GetFileNameWithoutExtension(storedPath));

        if (Directory.Exists(extractDir))
            Directory.Delete(extractDir, true);

        ZipFile.ExtractToDirectory(storedPath, extractDir);

        return extractDir;
    }

    public IEnumerable<string> GetFiles(string directoryPath)
    {
        return Directory.EnumerateFiles(directoryPath, "*", SearchOption.AllDirectories);
    }

    public long GetFileSize(string filePath)
    {
        return new FileInfo(filePath).Length;
    }

    public void Cleanup(string path)
    {
        if (File.Exists(path))
            File.Delete(path);
        else if (Directory.Exists(path))
            Directory.Delete(path, true);
    }
}
