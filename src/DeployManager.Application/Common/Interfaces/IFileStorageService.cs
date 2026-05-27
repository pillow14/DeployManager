namespace DeployManager.Application.Common.Interfaces;

public interface IFileStorageService
{
    string SavePackage(string packageId, string fileName, Stream content);
    string ExtractToDirectory(string storedPath);
    IEnumerable<string> GetFiles(string directoryPath);
    long GetFileSize(string filePath);
    void Cleanup(string path);
}
