using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Services;

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(GetRequiredConfig("Jwt:Key")));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var expireHours = int.Parse(_configuration["Jwt:ExpireHours"] ?? "8");

        var token = new JwtSecurityToken(
            issuer: GetRequiredConfig("Jwt:Issuer"),
            audience: GetRequiredConfig("Jwt:Audience"),
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expireHours),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(GetRequiredConfig("Jwt:Key")));

        var handler = new JwtSecurityTokenHandler();
        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = GetRequiredConfig("Jwt:Issuer"),
                ValidateAudience = true,
                ValidAudience = GetRequiredConfig("Jwt:Audience"),
                ValidateLifetime = false,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    private string GetRequiredConfig(string key)
    {
        return _configuration[key] ?? throw new InvalidOperationException($"Configuration '{key}' is not set. Application cannot start without a valid JWT configuration.");
    }
}
