using System.Collections.Concurrent;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Infrastructure.Fakes;

public class FakeUnitOfWork : IUnitOfWork
{
    private readonly ConcurrentDictionary<Type, ConcurrentDictionary<Guid, object>> _store = new();
    private readonly ConcurrentDictionary<Type, object> _repositories = new();

    public IRepository<T> Repository<T>() where T : class
    {
        return (IRepository<T>)_repositories.GetOrAdd(typeof(T), _ =>
        {
            var innerStore = _store.GetOrAdd(typeof(T), _ => new ConcurrentDictionary<Guid, object>());
            return new FakeRepository<T>(innerStore);
        });
    }

    public ConcurrentDictionary<Guid, object> GetStore<T>() where T : class
        => _store.GetOrAdd(typeof(T), _ => new ConcurrentDictionary<Guid, object>());

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(0);
}
