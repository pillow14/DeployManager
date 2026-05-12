using MediatR;
using DeployManager.Application.DTOs.Auth;

namespace DeployManager.Application.Features.Auth.Commands;

public class RefreshTokenCommand : IRequest<LoginResponse>
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}
