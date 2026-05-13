using MediatR;
using DeployManager.Application.DTOs.DeployJobs;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeployJobs.Queries;

public class GetAllDeployJobsQueryHandler : IRequestHandler<GetAllDeployJobsQuery, IEnumerable<DeployJobDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllDeployJobsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<DeployJobDto>> Handle(GetAllDeployJobsQuery request, CancellationToken cancellationToken)
    {
        var jobs = await _unitOfWork.Repository<DeployJob>()
            .FindAsync(j => !j.IsDeleted, cancellationToken);

        var query = jobs.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(j => j.Status.ToString().Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        }

        if (request.From.HasValue)
            query = query.Where(j => j.CreatedAt >= request.From.Value);

        if (request.To.HasValue)
            query = query.Where(j => j.CreatedAt <= request.To.Value);

        if (request.SiteId.HasValue)
            query = query.Where(j => j.SiteId == request.SiteId.Value);

        var sites = (await _unitOfWork.Repository<DeploySite>().FindAsync(s => !s.IsDeleted, cancellationToken))
            .ToDictionary(s => s.Id);

        var environments = (await _unitOfWork.Repository<DeployEnvironment>().FindAsync(e => !e.IsDeleted, cancellationToken))
            .ToDictionary(e => e.Id);

        var users = (await _unitOfWork.Repository<User>().GetAllAsync(cancellationToken))
            .ToDictionary(u => u.Id);

        return query
            .OrderByDescending(j => j.CreatedAt)
            .Select(j =>
            {
                sites.TryGetValue(j.SiteId, out var site);
                var envName = site is not null && environments.TryGetValue(site.EnvironmentId, out var env) ? env.Name : "";
                users.TryGetValue(j.CreatedByUserId ?? Guid.Empty, out var user);

                return new DeployJobDto
                {
                    Id = j.Id,
                    SiteId = j.SiteId,
                    SiteName = site?.Name ?? "Unknown",
                    EnvironmentName = envName,
                    FileName = j.FileName,
                    FileSize = j.FileSize,
                    Status = j.Status.ToString(),
                    LogSummary = j.LogSummary,
                    ErrorMessage = j.ErrorMessage,
                    StartedAt = j.StartedAt,
                    CompletedAt = j.CompletedAt,
                    CreatedAt = j.CreatedAt,
                    CreatedByUsername = user?.Username
                };
            });
    }
}
