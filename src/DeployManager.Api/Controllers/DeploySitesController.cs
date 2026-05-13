using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DeployManager.Application.Features.DeploySites.Commands;
using DeployManager.Application.Features.DeploySites.Queries;

namespace DeployManager.Api.Controllers;

[Authorize]
[Route("api/sites")]
public class DeploySitesController(ISender mediator) : BaseApiController(mediator)
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? environmentId, [FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(new GetAllDeploySitesQuery
        {
            EnvironmentId = environmentId,
            IncludeInactive = includeInactive
        }, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetDeploySiteByIdQuery { Id = id }, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDeploySiteCommand command, CancellationToken cancellationToken)
    {
        var id = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateDeploySiteCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest(new { error = "Id mismatch." });
        await Mediator.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, [FromQuery] bool hardDelete = false, CancellationToken cancellationToken = default)
    {
        await Mediator.Send(new DeleteDeploySiteCommand { Id = id, HardDelete = hardDelete }, cancellationToken);
        return NoContent();
    }
}
