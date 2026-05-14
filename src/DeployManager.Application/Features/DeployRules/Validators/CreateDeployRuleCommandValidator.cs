using FluentValidation;
using DeployManager.Application.Features.DeployRules.Commands;

namespace DeployManager.Application.Features.DeployRules.Validators;

public class CreateDeployRuleCommandValidator : AbstractValidator<CreateDeployRuleCommand>
{
    private static readonly string[] ValidActions = ["copy_overwrite", "copy_if_not_exists", "omit", "backup_and_copy", "delete_and_copy"];

    public CreateDeployRuleCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.SourcePattern)
            .NotEmpty().WithMessage("Source pattern is required.")
            .MaximumLength(500).WithMessage("Source pattern must not exceed 500 characters.");

        RuleFor(x => x.DestinationPath)
            .NotEmpty().WithMessage("Destination path is required.")
            .MaximumLength(500).WithMessage("Destination path must not exceed 500 characters.");

        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("Action is required.")
            .Must(v => ValidActions.Contains(v))
            .WithMessage($"Action must be one of: {string.Join(", ", ValidActions)}");

        RuleFor(x => x.Order)
            .GreaterThanOrEqualTo(0).WithMessage("Order must be a non-negative number.");
    }
}
