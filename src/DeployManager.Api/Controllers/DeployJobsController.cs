using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeployManager.Application.Common.Services;
using DeployManager.Application.Features.DeployJobs.Queries;

namespace DeployManager.Api.Controllers;

[Authorize]
[Route("api/jobs")]
public class DeployJobsController(
    ISender mediator,
    JobCancellationManager cancellationManager) : BaseApiController(mediator)
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetAllDeployJobsQuery query, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetDeployJobByIdQuery { Id = id }, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}/download-backup")]
    public IActionResult DownloadBackup(Guid id)
    {
        var zipPath = Path.Combine(Path.GetTempPath(), "DeployManager", "backup-zips", $"{id}.zip");
        if (!System.IO.File.Exists(zipPath))
            return NotFound(new { error = "Respaldo no encontrado." });

        var stream = new FileStream(zipPath, FileMode.Open, FileAccess.Read);
        return File(stream, "application/zip", $"respaldo-{id:N}.zip");
    }

    [HttpPost("{id:guid}/cancel")]
    public IActionResult Cancel(Guid id)
    {
        cancellationManager.Cancel(id);
        return Ok(new { message = "Solicitud de cancelación enviada." });
    }
}
