using DeployManager.Domain.Entities;

namespace DeployManager.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
    string? ValidateToken(string token);
    string GenerateRefreshToken();
}
