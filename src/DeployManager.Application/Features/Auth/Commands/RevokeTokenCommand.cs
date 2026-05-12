using MediatR;

namespace DeployManager.Application.Features.Auth.Commands;

public class RevokeTokenCommand : IRequest
{
    public Guid UserId { get; set; }
}
