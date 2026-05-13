using MediatR;

namespace DeployManager.Application.Features.DeployRules.Commands;

public class DeleteDeployRuleCommand : IRequest
{
    public Guid Id { get; set; }
}
