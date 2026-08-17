using FluentValidation;
using DeployManager.Application.Features.Rollback.Commands;

namespace DeployManager.Application.Features.Rollback.Validators;

public class ExecuteRollbackCommandValidator : AbstractValidator<ExecuteRollbackCommand>
{
    public ExecuteRollbackCommandValidator()
    {
        RuleFor(x => x.OriginalDeployJobId)
            .NotEmpty().WithMessage("Original deploy job ID is required.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Reason is required.")
            .MaximumLength(500).WithMessage("Reason must not exceed 500 characters.");
    }
}
