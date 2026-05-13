using FluentValidation;
using DeployManager.Application.Features.DeploySites.Commands;

namespace DeployManager.Application.Features.DeploySites.Validators;

public class CreateDeploySiteCommandValidator : AbstractValidator<CreateDeploySiteCommand>
{
    public CreateDeploySiteCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required.")
            .MaximumLength(50).WithMessage("Code must not exceed 50 characters.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.EnvironmentId)
            .NotEmpty().WithMessage("Environment is required.");

        RuleFor(x => x.TargetType)
            .NotEmpty().WithMessage("Target type is required.")
            .Must(v => v is "IIS" or "AzureAppService" or "FTPS" or "UNC")
            .WithMessage("Invalid target type.");

        RuleFor(x => x.RootPath)
            .NotEmpty().WithMessage("Root path is required.")
            .MaximumLength(500).WithMessage("Root path must not exceed 500 characters.");

        RuleFor(x => x.PublicUrl)
            .MaximumLength(500)
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .When(x => !string.IsNullOrWhiteSpace(x.PublicUrl))
            .WithMessage("Public URL must be a valid URL.");

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Username is required for remote connections.")
            .When(x => x.TargetType is "FTPS" or "UNC");
    }
}
