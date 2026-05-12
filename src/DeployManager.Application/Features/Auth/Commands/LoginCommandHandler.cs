using MediatR;
using Microsoft.Extensions.Configuration;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.DTOs.Auth;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Auth.Commands;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtService _jwtService;
    private readonly IPasswordService _passwordService;
    private readonly IConfiguration _configuration;

    public LoginCommandHandler(IUnitOfWork unitOfWork, IJwtService jwtService, IPasswordService passwordService, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _jwtService = jwtService;
        _passwordService = passwordService;
        _configuration = configuration;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var users = await _unitOfWork.Repository<Domain.Entities.User>()
            .FindAsync(u => u.Username == request.Username && !u.IsDeleted, cancellationToken);

        var user = users.FirstOrDefault();

        if (user == null || !_passwordService.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("User is not active.");

        var token = _jwtService.GenerateToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        var expireHours = int.Parse(_configuration["Jwt:ExpireHours"] ?? "8");
        var refreshExpireDays = int.Parse(_configuration["Jwt:RefreshExpireDays"] ?? "7");

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(refreshExpireDays);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddHours(expireHours),
            Username = user.Username,
            Role = user.Role
        };
    }
}
