using System.Security.Claims;
using DeployManager.Domain.Entities;

namespace DeployManager.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    string GenerateRefreshToken();
}
