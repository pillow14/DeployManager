using NLog;
using NLog.Web;
using DeployManager.Application;
using DeployManager.Infrastructure;
using DeployManager.Worker.Workers;

var logger = LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();
logger.Debug("Starting DeployManager.Worker");

try
{
    var host = Host.CreateDefaultBuilder(args)
        .ConfigureLogging(logging =>
        {
            logging.ClearProviders();
            logging.SetMinimumLevel(Microsoft.Extensions.Logging.LogLevel.Trace);
        })
        .UseNLog()
        .ConfigureServices((context, services) =>
        {
            services.AddApplication();
            services.AddInfrastructure(context.Configuration);
            services.AddHostedService<DeployWorker>();
        })
        .Build();

    host.Run();
}
catch (Exception ex)
{
    logger.Error(ex, "Worker startup failed.");
    throw;
}
finally
{
    LogManager.Shutdown();
}
