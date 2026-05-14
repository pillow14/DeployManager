using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeployRules.Commands;

public class UpdateDeployRuleCommandHandler : IRequestHandler<UpdateDeployRuleCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateDeployRuleCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateDeployRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _unitOfWork.Repository<DeployRule>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (rule is null || rule.IsDeleted)
            throw new KeyNotFoundException("Rule not found.");

        rule.Name = request.Name;
        rule.SourcePattern = request.SourcePattern;
        rule.DestinationPath = request.DestinationPath;
        rule.Action = request.Action;
        rule.Order = request.Order;
        rule.IsActive = request.IsActive;
        rule.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Repository<DeployRule>().UpdateAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
