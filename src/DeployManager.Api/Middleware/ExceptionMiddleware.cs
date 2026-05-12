using System.Net;
using System.Text.Json;

namespace DeployManager.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, response) = GetErrorResponse(exception);

        context.Response.StatusCode = (int)statusCode;
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }

    private static (HttpStatusCode statusCode, object response) GetErrorResponse(Exception exception)
    {
        return exception switch
        {
            Application.Common.Exceptions.ValidationException validationEx => (
                HttpStatusCode.BadRequest,
                new { error = "Validation failed", details = validationEx.Errors }
            ),
            UnauthorizedAccessException => (
                HttpStatusCode.Unauthorized,
                new { error = exception.Message }
            ),
            InvalidOperationException => (
                HttpStatusCode.BadRequest,
                new { error = exception.Message }
            ),
            KeyNotFoundException => (
                HttpStatusCode.NotFound,
                new { error = "Resource not found." }
            ),
            _ => (
                HttpStatusCode.InternalServerError,
                new { error = "An internal server error occurred." }
            )
        };
    }
}
