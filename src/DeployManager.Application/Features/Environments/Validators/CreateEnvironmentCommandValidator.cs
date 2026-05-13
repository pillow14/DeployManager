using FluentValidation;
using DeployManager.Application.Features.Environments.Commands;

namespace DeployManager.Application.Features.Environments.Validators;

public class CreateEnvironmentCommandValidator : AbstractValidator<CreateEnvironmentCommand>
{
    public CreateEnvironmentCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.TargetType)
            .NotEmpty().WithMessage("Target type is required.")
            .Must(v => v is "IIS" or "AzureAppService" or "FTPS" or "UNC")
            .WithMessage("Invalid target type.");

        RuleFor(x => x.TargetUrl)
            .NotEmpty().WithMessage("Target URL is required.")
            .MaximumLength(500).WithMessage("Target URL must not exceed 500 characters.")
            .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
            .WithMessage("Target URL must be a valid URL.");

        RuleFor(x => x.CredentialKey)
            .MaximumLength(200).WithMessage("Credential key must not exceed 200 characters.");
    }
}
