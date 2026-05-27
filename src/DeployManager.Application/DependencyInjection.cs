using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using DeployManager.Application.Common.Behaviours;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.Common.Services;
using DeployManager.Application.Features.Deploy.Services;

namespace DeployManager.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));

        services.AddScoped<IDeployRunnerService, DeployRunnerService>();
        services.AddSingleton<JobCancellationManager>();

        return services;
    }
}
