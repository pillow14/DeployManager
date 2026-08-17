using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeployManager.Application.Features.ScheduledDeploys.Commands;
using DeployManager.Application.Features.ScheduledDeploys.Queries;

namespace DeployManager.Api.Controllers;

[Authorize]
[Route("api/scheduled-deploys")]
public class ScheduledDeploysController(ISender mediator) : BaseApiController(mediator)
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetAllScheduledDeploysQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetScheduledDeployByIdQuery { Id = id }, cancellationToken);
        if (result is null)
            return NotFound(new { error = "Scheduled deploy not found." });
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateScheduledDeployCommand command, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid token." });

        command.CreatedByUserId = userId;
        var id = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateScheduledDeployCommand command, CancellationToken cancellationToken)
    {
        command.Id = id;
        await Mediator.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new CancelScheduledDeployCommand { Id = id }, cancellationToken);
        return NoContent();
    }
}
