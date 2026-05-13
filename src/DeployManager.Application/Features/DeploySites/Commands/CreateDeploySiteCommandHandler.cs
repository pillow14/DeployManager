using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeploySites.Commands;

public class CreateDeploySiteCommandHandler : IRequestHandler<CreateDeploySiteCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateDeploySiteCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateDeploySiteCommand request, CancellationToken cancellationToken)
    {
        var existing = await _unitOfWork.Repository<DeploySite>()
            .FindAsync(s => s.Code == request.Code && !s.IsDeleted, cancellationToken);

        if (existing.Any())
            throw new InvalidOperationException("Code already exists.");

        if (!Enum.TryParse<DeployTargetType>(request.TargetType, out var targetType))
            throw new InvalidOperationException("Invalid target type.");

        var environment = await _unitOfWork.Repository<DeployEnvironment>()
            .GetByIdAsync(request.EnvironmentId, cancellationToken);

        if (environment is null)
            throw new KeyNotFoundException("Environment not found.");

        var site = new DeploySite
        {
            Code = request.Code,
            Name = request.Name,
            EnvironmentId = request.EnvironmentId,
            TargetType = targetType,
            RootPath = request.RootPath,
            PublicUrl = request.PublicUrl,
            Username = request.Username,
            PasswordEncrypted = request.Password
        };

        await _unitOfWork.Repository<DeploySite>().AddAsync(site, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return site.Id;
    }
}
