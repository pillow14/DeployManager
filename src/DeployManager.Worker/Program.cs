using NLog;
using NLog.Web;
using DeployManager.Application;
using DeployManager.Infrastructure;

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
        .ConfigureAppConfiguration((context, config) =>
        {
            config.AddJsonFile(
                $"appsettings.{context.HostingEnvironment.EnvironmentName}.local.json",
                optional: true,
                reloadOnChange: true);
        })
        .ConfigureServices((context, services) =>
        {
            services.AddApplication();
            services.AddInfrastructure(context.Configuration);
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
