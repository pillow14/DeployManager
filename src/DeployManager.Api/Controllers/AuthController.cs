using MediatR;
using Microsoft.AspNetCore.Mvc;
using DeployManager.Application.Features.Auth.Commands;

namespace DeployManager.Api.Controllers;

public class AuthController(ISender mediator) : BaseApiController(mediator)
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
