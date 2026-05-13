using MediatR;

namespace DeployManager.Application.Features.DeploySites.Commands;

public class DeleteDeploySiteCommand : IRequest
{
    public Guid Id { get; set; }
    public bool HardDelete { get; set; }
}
