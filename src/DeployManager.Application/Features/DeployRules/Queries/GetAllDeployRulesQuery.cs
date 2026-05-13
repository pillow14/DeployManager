using MediatR;
using DeployManager.Application.DTOs.DeployRules;

namespace DeployManager.Application.Features.DeployRules.Queries;

public class GetAllDeployRulesQuery : IRequest<IEnumerable<DeployRuleDto>> { }
