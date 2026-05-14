using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeployRules.Commands;

public class CreateDeployRuleCommandHandler : IRequestHandler<CreateDeployRuleCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateDeployRuleCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateDeployRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = new DeployRule
        {
            Name = request.Name,
            SourcePattern = request.SourcePattern,
            DestinationPath = request.DestinationPath,
            Action = request.Action,
            Order = request.Order,
            IsActive = request.IsActive
        };

        await _unitOfWork.Repository<DeployRule>().AddAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return rule.Id;
    }
}
