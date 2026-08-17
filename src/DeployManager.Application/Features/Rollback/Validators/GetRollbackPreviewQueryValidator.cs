using FluentValidation;
using DeployManager.Application.Features.Rollback.Queries;

namespace DeployManager.Application.Features.Rollback.Validators;

public class GetRollbackPreviewQueryValidator : AbstractValidator<GetRollbackPreviewQuery>
{
    public GetRollbackPreviewQueryValidator()
    {
        RuleFor(x => x.OriginalDeployJobId)
            .NotEmpty().WithMessage("Original deploy job ID is required.");
    }
}
