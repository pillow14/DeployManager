using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.Common.Services;
using DeployManager.Application.Features.Deploy.Commands;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Api.Controllers;

[Authorize]
[Route("api/deploy")]
public class DeployController(ISender mediator) : BaseApiController(mediator)
{
    [HttpPost("upload")]
    [RequestSizeLimit(500 * 1024 * 1024)]
    public async Task<IActionResult> Upload([FromForm] Guid siteId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "File is required." });

        if (!file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only ZIP files are allowed." });

        using var stream = file.OpenReadStream();
        var command = new UploadPreviewCommand
        {
            SiteId = siteId,
            FileName = file.FileName,
            FileSize = file.Length,
            FileContent = stream
        };

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm(
        ConfirmDeployCommand command,
        [FromServices] IServiceScopeFactory scopeFactory,
        [FromServices] JobCancellationManager cancellationManager,
        CancellationToken cancellationToken)
    {
        var jobId = await Mediator.Send(command, cancellationToken);
        var ct = cancellationManager.Register(jobId);

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                var runner = scope.ServiceProvider.GetRequiredService<IDeployRunnerService>();
                var targets = scope.ServiceProvider.GetRequiredService<IEnumerable<IDeployTarget>>();

                var job = await unitOfWork.Repository<DeployJob>().GetByIdAsync(jobId);
                if (job is null || job.Status != DeployStatus.Pending)
                {
                    cancellationManager.Cleanup(jobId);
                    return;
                }

                job.Status = DeployStatus.InProgress;
                job.StartedAt = DateTime.UtcNow;
                await unitOfWork.SaveChangesAsync();

                var site = await unitOfWork.Repository<DeploySite>().GetByIdAsync(job.SiteId);
                if (site is null)
                {
                    job.Status = DeployStatus.Failed;
                    job.ErrorMessage = "Associated site not found.";
                    job.CompletedAt = DateTime.UtcNow;
                    await unitOfWork.SaveChangesAsync();
                    cancellationManager.Cleanup(jobId);
                    return;
                }

                var target = targets.FirstOrDefault(t => t.TargetType == site.TargetType);
                if (target is null)
                {
                    job.Status = DeployStatus.Failed;
                    job.ErrorMessage = $"No deploy target configured for {site.TargetType}.";
                    job.CompletedAt = DateTime.UtcNow;
                    await unitOfWork.SaveChangesAsync();
                    cancellationManager.Cleanup(jobId);
                    return;
                }

                await runner.ExecuteAsync(job, target, ct);
                cancellationManager.Cleanup(jobId);
            }
            catch (OperationCanceledException)
            {
                cancellationManager.Cleanup(jobId);
            }
            catch (Exception ex)
            {
                try
                {
                    using var scope = scopeFactory.CreateScope();
                    var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
                    var job = await unitOfWork.Repository<DeployJob>().GetByIdAsync(jobId);
                    if (job is not null && job.Status == DeployStatus.InProgress)
                    {
                        job.Status = DeployStatus.Failed;
                        job.ErrorMessage = $"Unexpected error: {ex.Message}";
                        job.CompletedAt = DateTime.UtcNow;
                        await unitOfWork.SaveChangesAsync();
                    }
                }
                catch
                {
                }
                cancellationManager.Cleanup(jobId);
            }
        });

        return Ok(new { jobId });
    }
}
