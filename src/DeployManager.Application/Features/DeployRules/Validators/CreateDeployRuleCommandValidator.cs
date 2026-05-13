using FluentValidation;
using DeployManager.Application.Features.DeployRules.Commands;

namespace DeployManager.Application.Features.DeployRules.Validators;

public class CreateDeployRuleCommandValidator : AbstractValidator<CreateDeployRuleCommand>
{
    private static readonly string[] ValidActions = ["CopyOverwrite", "CopyIfNotExists", "Skip", "BackupAndCopy", "DeleteAndCopy"];

    public CreateDeployRuleCommandValidator()
    {
        RuleFor(x => x.Pattern)
            .NotEmpty().WithMessage("Pattern is required.")
            .MaximumLength(500).WithMessage("Pattern must not exceed 500 characters.");

        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("Action is required.")
            .Must(v => ValidActions.Contains(v))
            .WithMessage($"Action must be one of: {string.Join(", ", ValidActions)}");

        RuleFor(x => x.Order)
            .GreaterThanOrEqualTo(0).WithMessage("Order must be a non-negative number.");
    }
}
