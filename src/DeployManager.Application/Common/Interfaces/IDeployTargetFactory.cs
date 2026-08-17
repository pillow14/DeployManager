using DeployManager.Domain.Entities;

namespace DeployManager.Application.Common.Interfaces;

public interface IDeployTargetFactory
{
    IDeployTarget CreateForSite(DeploySite site);
}
