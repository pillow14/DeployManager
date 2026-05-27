using System.Collections.Concurrent;

namespace DeployManager.Application.Common.Services;

public class JobCancellationManager
{
    private readonly ConcurrentDictionary<Guid, CancellationTokenSource> _sources = new();

    public CancellationToken Register(Guid jobId)
    {
        var cts = new CancellationTokenSource();
        _sources[jobId] = cts;
        return cts.Token;
    }

    public void Cancel(Guid jobId)
    {
        if (_sources.TryGetValue(jobId, out var cts))
            cts.Cancel();
    }

    public void Cleanup(Guid jobId)
    {
        if (_sources.TryRemove(jobId, out var cts))
            cts.Dispose();
    }
}
