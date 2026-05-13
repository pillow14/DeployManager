using MediatR;
using DeployManager.Application.DTOs.DeployRules;

namespace DeployManager.Application.Features.DeployRules.Queries;

public class GetDeployRuleByIdQuery : IRequest<DeployRuleDto>
{
    public Guid Id { get; set; }
}
