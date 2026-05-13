using MediatR;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeploySites.Commands;

public class DeleteDeploySiteCommandHandler : IRequestHandler<DeleteDeploySiteCommand>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteDeploySiteCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteDeploySiteCommand request, CancellationToken cancellationToken)
    {
        var site = await _unitOfWork.Repository<DeploySite>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (site is null || site.IsDeleted)
            throw new KeyNotFoundException("Site not found.");

        if (request.HardDelete)
        {
            var hasJobs = await _unitOfWork.Repository<DeployJob>()
                .FindAsync(j => j.SiteId == request.Id, cancellationToken);

            if (hasJobs.Any())
                throw new InvalidOperationException("Cannot delete site with associated deployments. Deactivate it instead.");

            await _unitOfWork.Repository<DeploySite>().DeleteAsync(site, cancellationToken);
        }
        else
        {
            site.IsDeleted = true;
            site.IsActive = false;
            site.UpdatedAt = DateTime.UtcNow;
            await _unitOfWork.Repository<DeploySite>().UpdateAsync(site, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
