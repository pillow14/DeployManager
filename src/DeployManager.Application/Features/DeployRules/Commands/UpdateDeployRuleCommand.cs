using MediatR;

namespace DeployManager.Application.Features.DeployRules.Commands;

public class UpdateDeployRuleCommand : IRequest
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SourcePattern { get; set; } = string.Empty;
    public string DestinationPath { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsActive { get; set; }
}
