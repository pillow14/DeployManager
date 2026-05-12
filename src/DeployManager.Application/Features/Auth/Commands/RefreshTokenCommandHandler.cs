using MediatR;
using Microsoft.Extensions.Configuration;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.DTOs.Auth;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Auth.Commands;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, LoginResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;

    public RefreshTokenCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    public async Task<LoginResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var principal = _jwtService.GetPrincipalFromExpiredToken(request.Token);
        if (principal is null)
            throw new UnauthorizedAccessException("Invalid token.");

        var userId = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null)
            throw new UnauthorizedAccessException("Invalid token.");

        var user = await _unitOfWork.Repository<Domain.Entities.User>().GetByIdAsync(Guid.Parse(userId), cancellationToken);
        if (user is null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiry <= DateTime.UtcNow)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("User is not active.");

        var newToken = _jwtService.GenerateToken(user);
        var newRefreshToken = _jwtService.GenerateRefreshToken();
        var expireHours = int.Parse(_configuration["Jwt:ExpireHours"] ?? "8");
        var refreshExpireDays = int.Parse(_configuration["Jwt:RefreshExpireDays"] ?? "7");

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(refreshExpireDays);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new LoginResponse
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(expireHours),
            Username = user.Username,
            Role = user.Role
        };
    }
}
