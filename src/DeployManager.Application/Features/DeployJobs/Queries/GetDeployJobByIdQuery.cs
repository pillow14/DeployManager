using MediatR;
using DeployManager.Application.Common.Interfaces;
using DeployManager.Application.DTOs.DeployJobs;
using DeployManager.Domain.Entities;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Application.Features.DeployJobs.Queries;

public class GetDeployJobByIdQuery : IRequest<DeployJobDetailDto>
{
    public Guid Id { get; set; }
}

public class GetDeployJobByIdQueryHandler : IRequestHandler<GetDeployJobByIdQuery, DeployJobDetailDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStoragePathProvider _paths;

    public GetDeployJobByIdQueryHandler(IUnitOfWork unitOfWork, IStoragePathProvider paths)
    {
        _unitOfWork = unitOfWork;
        _paths = paths;
    }

    public async Task<DeployJobDetailDto> Handle(GetDeployJobByIdQuery request, CancellationToken cancellationToken)
    {
        var job = await _unitOfWork.Repository<DeployJob>()
            .GetByIdAsync(request.Id, cancellationToken);

        if (job is null || job.IsDeleted)
            throw new KeyNotFoundException("Deploy job not found.");

        var site = (await _unitOfWork.Repository<DeploySite>().FindAsync(s => s.Id == job.SiteId && !s.IsDeleted, cancellationToken)).FirstOrDefault();
        var env = site is not null
            ? (await _unitOfWork.Repository<DeployEnvironment>().FindAsync(e => e.Id == site.EnvironmentId && !e.IsDeleted, cancellationToken)).FirstOrDefault()
            : null;
        var user = job.CreatedByUserId.HasValue
            ? (await _unitOfWork.Repository<User>().FindAsync(u => u.Id == job.CreatedByUserId.Value, cancellationToken)).FirstOrDefault()
            : null;

        var logs = await _unitOfWork.Repository<DeployLog>()
            .FindAsync(l => l.DeployJobId == job.Id, cancellationToken);

        return new DeployJobDetailDto
        {
            Id = job.Id,
            SiteId = job.SiteId,
            SiteName = site?.Name ?? "Unknown",
            SiteCode = site?.Code ?? "",
            EnvironmentName = env?.Name ?? "",
            TargetType = site?.TargetType.ToString() ?? "",
            FileName = job.FileName,
            FileSize = job.FileSize,
            Status = job.Status.ToString(),
            LogSummary = job.LogSummary,
            ErrorMessage = job.ErrorMessage,
            StartedAt = job.StartedAt,
            CompletedAt = job.CompletedAt,
            CreatedAt = job.CreatedAt,
            CreatedByUsername = user?.Username,
            HasBackup = File.Exists(_paths.GetBackupZipPath(job.Id)),
            Logs = logs
                .OrderBy(l => l.CreatedAt)
                .Select(l => new DeployLogEntryDto
                {
                    Timestamp = l.CreatedAt,
                    Level = l.Level,
                    Message = l.Message
                })
                .ToList()
        };
    }
}
