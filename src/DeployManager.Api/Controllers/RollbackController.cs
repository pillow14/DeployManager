using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeployManager.Application.Features.Rollback.Commands;
using DeployManager.Application.Features.Rollback.Queries;
using System.Security.Claims;

namespace DeployManager.Api.Controllers;

[Authorize]
[Route("api/rollback")]
public class RollbackController(ISender mediator) : BaseApiController(mediator)
{
    [HttpGet("preview/{executionId:guid}")]
    public async Task<IActionResult> Preview(Guid executionId, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetRollbackPreviewQuery { OriginalDeployJobId = executionId }, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Execute(ExecuteRollbackCommand command, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid token." });

        command.ExecutedByUserId = userId;
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpGet("history")]
    public async Task<IActionResult> History(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetRollbackHistoryQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetRollbackExecutionByIdQuery { Id = id }, cancellationToken);
        if (result is null)
            return NotFound(new { error = "Rollback execution not found." });
        return Ok(result);
    }
}
