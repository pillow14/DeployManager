using MediatR;

namespace DeployManager.Application.Features.DeployRules.Commands;

public class CreateDeployRuleCommand : IRequest<Guid>
{
    public string Pattern { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsEnabled { get; set; } = true;
}
