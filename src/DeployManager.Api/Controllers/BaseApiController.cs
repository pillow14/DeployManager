using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace DeployManager.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController(ISender mediator) : ControllerBase
{
    protected ISender Mediator => mediator;
}
