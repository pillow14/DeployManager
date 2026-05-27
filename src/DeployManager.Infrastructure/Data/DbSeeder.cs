using Microsoft.EntityFrameworkCore;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Common;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;

namespace DeployManager.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(DeployDbContext context, IPasswordService passwordService)
    {
        await context.Database.MigrateAsync();

        if (await context.Users.AnyAsync())
            return;

        var admin = new User
        {
            Username = "admin",
            Email = "admin@deploymanager.com",
            PasswordHash = passwordService.Hash("Admin123!"),
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
