using MediatR;
using DeployManager.Application.DTOs.DeployRules;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeployRules.Queries;

public class GetAllDeployRulesQueryHandler : IRequestHandler<GetAllDeployRulesQuery, IEnumerable<DeployRuleDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllDeployRulesQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<DeployRuleDto>> Handle(GetAllDeployRulesQuery request, CancellationToken cancellationToken)
    {
        var rules = await _unitOfWork.Repository<DeployRule>()
            .FindAsync(r => !r.IsDeleted, cancellationToken);

        return rules
            .OrderBy(r => r.Order)
            .Select(r => new DeployRuleDto
            {
                Id = r.Id,
                Pattern = r.Pattern,
                Action = r.Action,
                Order = r.Order,
                IsEnabled = r.IsEnabled,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            });
    }
}
