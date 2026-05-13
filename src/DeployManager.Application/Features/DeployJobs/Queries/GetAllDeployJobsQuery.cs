using MediatR;
using DeployManager.Application.DTOs.DeployJobs;

namespace DeployManager.Application.Features.DeployJobs.Queries;

public class GetAllDeployJobsQuery : IRequest<IEnumerable<DeployJobDto>>
{
    public string? Status { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public Guid? SiteId { get; set; }
    public Guid? EnvironmentId { get; set; }
}
