using Microsoft.EntityFrameworkCore;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Common;
using DeployManager.Domain.Entities;

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
        await context.SaveChangesAsync();
    }
}
