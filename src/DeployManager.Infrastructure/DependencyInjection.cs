using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.Common.Options;
using DeployManager.Domain.Interfaces;
using DeployManager.Infrastructure.Data;
using DeployManager.Infrastructure.Fakes;
using DeployManager.Infrastructure.Repositories;
using DeployManager.Infrastructure.Services;

namespace DeployManager.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<StorageOptions>(configuration.GetSection(StorageOptions.SectionName));
        services.AddSingleton<IStoragePathProvider, StoragePathProvider>();

        var provider = configuration["DatabaseProvider"] ?? "SqlServer";

        if (provider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<FakeUnitOfWork>();
            services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<FakeUnitOfWork>());
        }
        else
        {
            services.AddDbContext<DeployDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(DeployDbContext).Assembly.FullName)));

            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        }

        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<IFileStorageService, FileStorageService>();

        services.AddScoped<IDeployTarget, LocalDeployTarget>();
        services.AddScoped<IDeployTarget, UncDeployTarget>();
        services.AddScoped<IDeployTarget, FtpDeployTarget>();
        services.AddScoped<IDeployTarget, AzureKuduDeployTarget>();

        services.AddScoped<IBackupManifestService, BackupManifestService>();
        services.AddScoped<IRollbackService, RollbackService>();
        services.AddSingleton<IRollbackSettings>(sp =>
        {
            var config = sp.GetRequiredService<IConfiguration>();
            var section = config.GetSection("Rollback");
            return new RollbackSettings(
                section.GetValue<bool>("DeleteFilesCreatedByDeploy", true),
                section.GetValue<bool>("AllowPartialRollback", false),
                section.GetValue<bool>("BackupBeforeRollback", true));
        });
        services.AddScoped<IDeployTargetFactory, DeployTargetFactory>();

        services.AddSingleton<Microsoft.Extensions.Hosting.IHostedService, ScheduledDeployWorker>();
        services.AddSingleton<Microsoft.Extensions.Hosting.IHostedService, DeployJobWorker>();

        services.AddScoped<IEmailService, EmailService>();

        return services;
    }
}
