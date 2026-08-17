using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MailKit.Net.Smtp;
using DeployManager.Application.Common.Interfaces;

namespace DeployManager.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly string _host;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;
    private readonly string _fromAddress;
    private readonly string _fromName;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        var smtp = configuration.GetSection("Smtp");
        _host = smtp["Host"] ?? "localhost";
        _port = int.TryParse(smtp["Port"], out var p) ? p : 587;
        _username = smtp["Username"] ?? "";
        _password = smtp["Password"] ?? "";
        _fromAddress = smtp["FromAddress"] ?? "";
        _fromName = smtp["FromName"] ?? "DeployManager";
    }

    public async Task SendDeployStartNotificationAsync(string siteName, string packageName, List<string> recipients, string triggeredBy, CancellationToken cancellationToken = default)
    {
        if (recipients is null || recipients.Count == 0)
        {
            _logger.LogDebug("No recipients for deploy start notification — skipping.");
            return;
        }

        var subject = $"[DeployManager] Deploy started on '{siteName}'";
        var html = $"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Deploy started</h2>
              <p><strong>Site:</strong> {siteName}</p>
              <p><strong>Package:</strong> {packageName}</p>
              <p><strong>Triggered by:</strong> {triggeredBy}</p>
              <p style="color: #6b7280; font-size: 12px;">{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            </div>
            """;

        await SendEmailAsync(subject, html, recipients, cancellationToken);
    }

    public async Task SendDeployResultNotificationAsync(string siteName, string packageName, string status, string? duration, string? errorMessage, int fileCount, List<string> recipients, CancellationToken cancellationToken = default)
    {
        if (recipients is null || recipients.Count == 0)
        {
            _logger.LogDebug("No recipients for deploy result notification — skipping.");
            return;
        }

        var statusColor = status.Equals("Completed", StringComparison.OrdinalIgnoreCase) ? "#16a34a" : "#dc2626";
        var subject = $"[DeployManager] Deploy {status} on '{siteName}'";
        var errorSection = !string.IsNullOrEmpty(errorMessage)
            ? $"<p style=\"color:#dc2626;\"><strong>Error:</strong> {errorMessage}</p>"
            : "";
        var durationSection = !string.IsNullOrEmpty(duration)
            ? $"<p><strong>Duration:</strong> {duration}</p>"
            : "";
        var html = $"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: {statusColor};">Deploy {status}</h2>
              <p><strong>Site:</strong> {siteName}</p>
              <p><strong>Package:</strong> {packageName}</p>
              <p><strong>Files processed:</strong> {fileCount}</p>
              {durationSection}
              {errorSection}
              <p style="color: #6b7280; font-size: 12px;">{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC</p>
            </div>
            """;

        await SendEmailAsync(subject, html, recipients, cancellationToken);
    }

    private async Task SendEmailAsync(string subject, string htmlBody, List<string> recipients, CancellationToken cancellationToken)
    {
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromAddress));
            foreach (var r in recipients)
                message.To.Add(MailboxAddress.Parse(r));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(_host, _port, MailKit.Security.SecureSocketOptions.StartTls, cancellationToken);
            if (!string.IsNullOrEmpty(_username))
                await client.AuthenticateAsync(_username, _password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation("Email sent to {Count} recipients: {Subject}", recipients.Count, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email: {Subject}", subject);
        }
    }
}
