using MediatR;
using DeployManager.Application.DTOs.DeploySites;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.Environments.Queries;

public class GetEnvironmentByIdQueryHandler : IRequestHandler<GetEnvironmentByIdQuery, EnvironmentDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetEnvironmentByIdQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<EnvironmentDto> Handle(GetEnvironmentByIdQuery request, CancellationToken cancellationToken)
    {
        var environment = await _unitOfWork.Repository<DeployEnvironment>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (environment is null || environment.IsDeleted)
            throw new KeyNotFoundException("Environment not found.");

        return new EnvironmentDto
        {
            Id = environment.Id,
            Name = environment.Name,
            Description = environment.Description,
            TargetType = environment.TargetType.ToString(),
            TargetUrl = environment.TargetUrl,
            IsActive = environment.IsActive
        };
    }
}
