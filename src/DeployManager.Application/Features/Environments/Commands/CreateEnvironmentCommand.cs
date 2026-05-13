using MediatR;

namespace DeployManager.Application.Features.Environments.Commands;

public class CreateEnvironmentCommand : IRequest<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public string TargetUrl { get; set; } = string.Empty;
    public string? CredentialKey { get; set; }
}
