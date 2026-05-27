using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using DeployManager.Api.Configuration;
using DeployManager.Application.Features.Packages.Queries;
using DeployManager.Application.Features.Packages.Commands;
using DeployManager.Application.DTOs.Packages;

namespace DeployManager.Api.Controllers;

[Authorize]
[Route("api/packages")]
public class PackagesController(ISender mediator, IOptions<PackageMockOptions> mockOptions)
    : BaseApiController(mediator)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (mockOptions.Value.UseMockPackages)
        {
            var mock = new List<PackageDto>
            {
                new() { Id = Guid.NewGuid(), FileName = "mock-build-v1.0.0.zip", FileSize = 2_456_000, Status = "Uploaded", SiteName = "Sitio Mock 1", CreatedAt = DateTime.UtcNow.AddDays(-1) },
                new() { Id = Guid.NewGuid(), FileName = "mock-build-v1.0.1.zip", FileSize = 3_120_000, Status = "Deployed", SiteName = "Sitio Mock 2", CreatedAt = DateTime.UtcNow.AddHours(-5) },
            };
            return Ok(mock);
        }

        var result = await Mediator.Send(new GetAllPackagesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [RequestSizeLimit(500 * 1024 * 1024)]
    public async Task<IActionResult> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "El archivo es obligatorio." });

        if (!file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Solo se permiten archivos ZIP." });

        if (mockOptions.Value.UseMockPackages)
        {
            var mock = new PackageDto
            {
                Id = Guid.NewGuid(),
                FileName = file.FileName,
                FileSize = file.Length,
                Status = "Uploaded",
                CreatedAt = DateTime.UtcNow,
            };
            return Ok(mock);
        }

        using var stream = file.OpenReadStream();
        var command = new UploadPackageCommand
        {
            FileName = file.FileName,
            FileSize = file.Length,
            FileContent = stream,
        };

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        if (mockOptions.Value.UseMockPackages)
            return NotFound(new { error = "Descarga no disponible en modo mock." });

        var pkg = await Mediator.Send(new GetPackageByIdQuery { Id = id }, cancellationToken);
        if (pkg is null)
            return NotFound(new { error = "Paquete no encontrado." });

        var filePath = pkg.StoredPath;
        if (!System.IO.File.Exists(filePath))
            return NotFound(new { error = "Archivo físico no encontrado." });

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        return File(stream, "application/zip", pkg.FileName);
    }
}


