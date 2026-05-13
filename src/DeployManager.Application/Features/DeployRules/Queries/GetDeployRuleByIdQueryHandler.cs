using MediatR;
using DeployManager.Application.DTOs.DeployRules;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeployRules.Queries;

public class GetDeployRuleByIdQueryHandler : IRequestHandler<GetDeployRuleByIdQuery, DeployRuleDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDeployRuleByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DeployRuleDto> Handle(GetDeployRuleByIdQuery request, CancellationToken cancellationToken)
    {
        var rule = await _unitOfWork.Repository<DeployRule>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (rule is null || rule.IsDeleted)
            throw new KeyNotFoundException("Rule not found.");

        return new DeployRuleDto
        {
            Id = rule.Id,
            Pattern = rule.Pattern,
            Action = rule.Action,
            Order = rule.Order,
            IsEnabled = rule.IsEnabled,
            CreatedAt = rule.CreatedAt,
            UpdatedAt = rule.UpdatedAt
        };
    }
}
