using FluentValidation;
using DeployManager.Application.Features.ScheduledDeploys.Commands;

namespace DeployManager.Application.Features.ScheduledDeploys.Validators;

public class CreateScheduledDeployCommandValidator : AbstractValidator<CreateScheduledDeployCommand>
{
    public CreateScheduledDeployCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.SiteId)
            .NotEmpty().WithMessage("Site is required.");

        RuleFor(x => x.ScheduledAt)
            .NotEmpty().WithMessage("Scheduled date/time is required.")
            .GreaterThan(DateTime.UtcNow).WithMessage("Scheduled date must be in the future.");

        RuleFor(x => x.Recipients)
            .NotEmpty().WithMessage("At least one recipient is required.");

        RuleForEach(x => x.Recipients)
            .EmailAddress().WithMessage("Invalid email address format.");
    }
}

public class UpdateScheduledDeployCommandValidator : AbstractValidator<UpdateScheduledDeployCommand>
{
    public UpdateScheduledDeployCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID is required.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.ScheduledAt)
            .NotEmpty().WithMessage("Scheduled date/time is required.")
            .GreaterThan(DateTime.UtcNow).WithMessage("Scheduled date must be in the future.");

        RuleFor(x => x.Recipients)
            .NotEmpty().WithMessage("At least one recipient is required.");

        RuleForEach(x => x.Recipients)
            .EmailAddress().WithMessage("Invalid email address format.");
    }
}
