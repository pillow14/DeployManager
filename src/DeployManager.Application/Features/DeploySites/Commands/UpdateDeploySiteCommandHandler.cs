using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Enums;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeploySites.Commands;

public class UpdateDeploySiteCommandHandler : IRequestHandler<UpdateDeploySiteCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public UpdateDeploySiteCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateDeploySiteCommand request, CancellationToken cancellationToken)
    {
        var site = await _unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (site is null || site.IsDeleted)
            throw new KeyNotFoundException("Site not found.");

        var duplicate = await _unitOfWork.Repository<DeploySite>()
            .FindAsync(s => s.Code == request.Code && s.Id != request.Id && !s.IsDeleted, cancellationToken);

        if (duplicate.Any())
            throw new InvalidOperationException("Code already exists.");

        if (!Enum.TryParse<DeployTargetType>(request.TargetType, out var targetType))
            throw new InvalidOperationException("Invalid target type.");

        var environment = await _unitOfWork.Repository<DeployEnvironment>()
            .GetByIdAsync(request.EnvironmentId, cancellationToken);

        if (environment is null)
            throw new KeyNotFoundException("Environment not found.");

        site.Code = request.Code;
        site.Name = request.Name;
        site.EnvironmentId = request.EnvironmentId;
        site.TargetType = targetType;
        site.RootPath = request.RootPath;
        site.PublicUrl = request.PublicUrl;
        site.Username = request.Username;
        site.IsActive = request.IsActive;
        site.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            site.PasswordEncrypted = request.Password;
        }

        await _unitOfWork.Repository<DeploySite>().UpdateAsync(site, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
