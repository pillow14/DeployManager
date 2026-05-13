using MediatR;

namespace DeployManager.Application.Features.Environments.Commands;

public class DeleteEnvironmentCommand : IRequest
{
    public Guid Id { get; set; }
}
