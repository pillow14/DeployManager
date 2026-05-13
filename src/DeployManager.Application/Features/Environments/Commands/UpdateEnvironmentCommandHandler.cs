using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Environments.Commands;

public class UpdateEnvironmentCommandHandler : IRequestHandler<UpdateEnvironmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateEnvironmentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateEnvironmentCommand request, CancellationToken cancellationToken)
    {
        var environment = await _unitOfWork.Repository<DeployEnvironment>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (environment is null || environment.IsDeleted)
            throw new KeyNotFoundException("Environment not found.");

        var duplicate = await _unitOfWork.Repository<DeployEnvironment>()
            .FindAsync(e => e.Name == request.Name && e.Id != request.Id && !e.IsDeleted, cancellationToken);

        if (duplicate.Any())
            throw new InvalidOperationException("Environment name already exists.");

        if (!Enum.TryParse<DeployTargetType>(request.TargetType, out var targetType))
            throw new InvalidOperationException("Invalid target type.");

        environment.Name = request.Name;
        environment.Description = request.Description;
        environment.TargetType = targetType;
        environment.TargetUrl = request.TargetUrl;
        environment.CredentialKey = request.CredentialKey;
        environment.IsActive = request.IsActive;
        environment.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Repository<DeployEnvironment>().UpdateAsync(environment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
