using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Environments.Commands;

public class CreateEnvironmentCommandHandler : IRequestHandler<CreateEnvironmentCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateEnvironmentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateEnvironmentCommand request, CancellationToken cancellationToken)
    {
        var existing = await _unitOfWork.Repository<DeployEnvironment>()
            .FindAsync(e => e.Name == request.Name && !e.IsDeleted, cancellationToken);

        if (existing.Any())
            throw new InvalidOperationException("Environment name already exists.");

        if (!Enum.TryParse<DeployTargetType>(request.TargetType, out var targetType))
            throw new InvalidOperationException("Invalid target type.");

        var environment = new DeployEnvironment
        {
            Name = request.Name,
            Description = request.Description,
            TargetType = targetType,
            TargetUrl = request.TargetUrl,
            CredentialKey = request.CredentialKey,
            IsActive = true
        };

        await _unitOfWork.Repository<DeployEnvironment>().AddAsync(environment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return environment.Id;
    }
}
