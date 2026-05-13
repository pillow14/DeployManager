using MediatR;

namespace DeployManager.Application.Features.Environments.Commands;

public class UpdateEnvironmentCommand : IRequest
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public string? CredentialKey { get; set; }
    public bool IsActive { get; set; }
}
