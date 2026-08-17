using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NLog;
using NLog.Web;
using DeployManager.Api.Health;
using DeployManager.Api.Middleware;
using DeployManager.Application;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Common;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;
using DeployManager.Infrastructure;
using DeployManager.Infrastructure.Data;
using DeployManager.Api.Configuration;

var logger = LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();
logger.Debug("Starting DeployManager.Api");

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Configuration.AddJsonFile(
        $"appsettings.{builder.Environment.EnvironmentName}.local.json",
        optional: true,
        reloadOnChange: true);

    builder.Logging.ClearProviders();
    builder.Logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Trace);
    builder.Host.UseNLog();

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);
    builder.Services.Configure<PackageMockOptions>(builder.Configuration.GetSection("FeatureFlags"));

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.Converters.Add(new DeployManager.Api.Converters.UtcDateTimeConverter());
        });

    var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is required");
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is required");
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is required");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ClockSkew = TimeSpan.Zero
            };
        });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly", policy => policy.RequireRole(Roles.Administrator));
        options.AddPolicy("PublisherOrAbove", policy => policy.RequireRole(Roles.Administrator, Roles.Publisher));
        options.AddPolicy("Authenticated", policy => policy.RequireAuthenticatedUser());
    });

    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "DeployManager API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.Http,
            Scheme = "bearer"
        });
        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    var dbProvider = builder.Configuration["DatabaseProvider"] ?? "SqlServer";
    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            if (corsOrigins.Length == 0)
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            }
            else
            {
                policy.WithOrigins(corsOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader();
            }
        });
    });

    if (dbProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
    {
        builder.Services.AddHealthChecks();
    }
    else
    {
        builder.Services.AddHealthChecks().AddCheck<DatabaseHealthCheck>("database");
    }

    var app = builder.Build();

    var adminUsername = builder.Configuration["AdminUser:Username"] ?? "admin";
    var adminEmail = builder.Configuration["AdminUser:Email"] ?? "admin@deploymanager.com";
    var adminPassword = builder.Configuration["AdminUser:Password"] ?? string.Empty;

    if (dbProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
    {
        using (var scope = app.Services.CreateScope())
        {
            var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();

            if (!(await uow.Repository<User>().GetAllAsync()).Any())
            {
                if (string.IsNullOrWhiteSpace(adminPassword))
                    throw new InvalidOperationException("AdminUser:Password is required on first startup to create the initial administrator user.");

                var admin = new User
                {
                    Username = adminUsername,
                    Email = adminEmail,
                    PasswordHash = passwordService.Hash(adminPassword),
                    Role = Roles.Administrator,
                    IsActive = true
                };
                await uow.Repository<User>().AddAsync(admin);
                logger.Info("InMemory seed: admin user created.");
            }

            if (!(await uow.Repository<DeployEnvironment>().GetAllAsync()).Any())
            {
                var environments = new[]
                {
                    new DeployEnvironment { Name = "Development", Description = "Development environment", TargetType = DeployTargetType.IIS, TargetUrl = "http://dev.local", IsActive = true },
                    new DeployEnvironment { Name = "Staging", Description = "Staging environment", TargetType = DeployTargetType.IIS, TargetUrl = "http://staging.local", IsActive = true },
                    new DeployEnvironment { Name = "Production", Description = "Production environment", TargetType = DeployTargetType.IIS, TargetUrl = "http://production.local", IsActive = true }
                };
                foreach (var env in environments)
                    await uow.Repository<DeployEnvironment>().AddAsync(env);
                logger.Info("InMemory seed: 3 environments created.");
            }

            await uow.SaveChangesAsync();
        }
    }
    else
    {
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<DeployDbContext>();
            var passwordService = scope.ServiceProvider.GetRequiredService<IPasswordService>();
            await DbSeeder.SeedAsync(context, passwordService, adminUsername, adminEmail, adminPassword);
        }
    }

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    var wwwRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
    var hasFrontend = File.Exists(Path.Combine(wwwRoot, "index.html"));

    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost
    });
    app.UseCors("Frontend");
    app.UseMiddleware<ExceptionMiddleware>();
    app.UseHttpsRedirection();
    app.UseAuthentication();
    app.UseAuthorization();

    if (hasFrontend)
    {
        app.UseDefaultFiles();
        app.UseStaticFiles();
    }

    app.MapControllers();
    app.MapHealthChecks("/health");

    if (hasFrontend)
    {
        app.MapWhen(
            ctx => !ctx.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase)
                && !ctx.Request.Path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase)
                && !ctx.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase),
            spa =>
            {
                spa.UseDefaultFiles();
                spa.UseStaticFiles();
                spa.Run(async context =>
                {
                    var indexPath = Path.Combine(wwwRoot, "index.html");
                    if (File.Exists(indexPath))
                    {
                        context.Response.ContentType = "text/html; charset=utf-8";
                        await context.Response.SendFileAsync(indexPath);
                    }
                    else
                    {
                        context.Response.StatusCode = StatusCodes.Status404NotFound;
                    }
                });
            });
    }

    app.Run();
}
catch (Exception ex)
{
    logger.Error(ex, "Application startup failed.");
    throw;
}
finally
{
    LogManager.Shutdown();
}
