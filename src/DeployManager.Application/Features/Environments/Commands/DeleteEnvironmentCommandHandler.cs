using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Environments.Commands;

public class DeleteEnvironmentCommandHandler : IRequestHandler<DeleteEnvironmentCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteEnvironmentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteEnvironmentCommand request, CancellationToken cancellationToken)
    {
        var environment = await _unitOfWork.Repository<DeployEnvironment>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (environment is null || environment.IsDeleted)
            throw new KeyNotFoundException("Environment not found.");

        var sites = await _unitOfWork.Repository<DeploySite>()
            .FindAsync(s => s.EnvironmentId == request.Id && !s.IsDeleted, cancellationToken);

        if (sites.Any())
            throw new InvalidOperationException("Cannot delete environment with associated sites. Deactivate it instead.");

        environment.IsDeleted = true;
        environment.IsActive = false;
        environment.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Repository<DeployEnvironment>().UpdateAsync(environment, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
