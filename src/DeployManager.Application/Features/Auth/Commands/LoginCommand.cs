using MediatR;
using DeployManager.Application.DTOs.Auth;

namespace DeployManager.Application.Features.Auth.Commands;

public class LoginCommand : IRequest<LoginResponse>
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
