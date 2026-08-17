using DeployManager.Application.Common.Interfaces;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Services;

public class DeployTargetFactory : IDeployTargetFactory
{
    private readonly IEnumerable<IDeployTarget> _targets;

    public DeployTargetFactory(IEnumerable<IDeployTarget> targets)
    {
        _targets = targets;
    }

    public IDeployTarget CreateForSite(DeploySite site)
    {
        var target = _targets.FirstOrDefault(t => t.TargetType == site.TargetType);
        if (target is null)
            throw new InvalidOperationException($"No deploy target found for type {site.TargetType}.");
        return target;
    }
}
