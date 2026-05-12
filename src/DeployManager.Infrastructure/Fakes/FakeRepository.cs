using System.Collections.Concurrent;
using System.Linq.Expressions;
using System.Reflection;
using DeployManager.Domain.Interfaces;

namespace DeployManager.Infrastructure.Fakes;

public class FakeRepository<T> : IRepository<T> where T : class
{
    private static readonly PropertyInfo IdProperty = typeof(T).GetProperty("Id")!;
    private readonly ConcurrentDictionary<Guid, object> _store;

    public FakeRepository(ConcurrentDictionary<Guid, object> store)
    {
        _store = store;
    }

    private static Guid GetId(T entity) => (Guid)IdProperty.GetValue(entity)!;

    public Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _store.TryGetValue(id, out var entity);
        return Task.FromResult((T?)entity);
    }

    public Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Values.Cast<T>());

    public Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
        => Task.FromResult(_store.Values.Cast<T>().Where(predicate.Compile()));

    public Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        _store[GetId(entity)] = entity;
        return Task.FromResult(entity);
    }

    public Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        _store[GetId(entity)] = entity;
        return Task.CompletedTask;
    }

    public Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        _store.TryRemove(GetId(entity), out _);
        return Task.CompletedTask;
    }

    public IQueryable<T> Query() => _store.Values.Cast<T>().AsQueryable();
}
