using MediatR;

namespace DeployManager.Application.Features.DeploySites.Commands;

public class CreateDeploySiteCommand : IRequest<Guid>
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid EnvironmentId { get; set; }
    public string TargetType { get; set; } = string.Empty;
    public string RootPath { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
}
