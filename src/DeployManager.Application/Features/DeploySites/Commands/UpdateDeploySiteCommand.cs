using MediatR;

namespace DeployManager.Application.Features.DeploySites.Commands;

public class UpdateDeploySiteCommand : IRequest
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid EnvironmentId { get; set; }
    public string TargetType { get; set; } = string.Empty;
    public string RootPath { get; set; } = string.Empty;
    public string? PublicUrl { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool IsActive { get; set; }
}
