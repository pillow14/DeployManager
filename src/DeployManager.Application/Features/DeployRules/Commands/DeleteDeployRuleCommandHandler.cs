using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeployRules.Commands;

public class DeleteDeployRuleCommandHandler : IRequestHandler<DeleteDeployRuleCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteDeployRuleCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteDeployRuleCommand request, CancellationToken cancellationToken)
    {
        var rule = await _unitOfWork.Repository<DeployRule>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (rule is null || rule.IsDeleted)
            throw new KeyNotFoundException("Rule not found.");

        rule.IsDeleted = true;
        rule.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Repository<DeployRule>().UpdateAsync(rule, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
