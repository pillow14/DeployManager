using Microsoft.EntityFrameworkCore;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Common;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;

namespace DeployManager.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        DeployDbContext context,
        IPasswordService passwordService,
        string adminUsername,
        string adminEmail,
        string adminPassword,
        CancellationToken cancellationToken = default)
    {
        await context.Database.MigrateAsync(cancellationToken);

        if (await context.Users.AnyAsync(cancellationToken))
            return;

        if (string.IsNullOrWhiteSpace(adminPassword))
            throw new InvalidOperationException(
                "AdminUser:Password is required on first startup to create the initial administrator user. Set it via configuration (e.g. Azure App Settings).");

        var admin = new User
        {
            Username = string.IsNullOrWhiteSpace(adminUsername) ? "admin" : adminUsername,
            Email = string.IsNullOrWhiteSpace(adminEmail) ? "admin@deploymanager.com" : adminEmail,
            PasswordHash = passwordService.Hash(adminPassword),
            Role = Roles.Administrator,
            IsActive = true
        };
        context.Users.Add(admin);

        var environments = new[]
        {
            new DeployEnvironment { Name = "Development", Description = "Development environment", TargetType = DeployTargetType.IIS, TargetUrl = "http://dev.local", IsActive = true },
            new DeployEnvironment { Name = "Staging", Description = "Staging environment", TargetType = DeployTargetType.IIS, TargetUrl = "http://staging.local", IsActive = true },
            new DeployEnvironment { Name = "Production", Description = "Production environment", TargetType = DeployTargetType.IIS, TargetUrl = "http://production.local", IsActive = true }
        };
        context.Environments.AddRange(environments);

        await context.SaveChangesAsync();
    }
}
