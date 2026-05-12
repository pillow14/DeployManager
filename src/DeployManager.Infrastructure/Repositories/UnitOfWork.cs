using System.Collections.Concurrent;
using DeployManager.Domain.Interfaces;
using DeployManager.Infrastructure.Data;

namespace DeployManager.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly DeployDbContext _context;
    private readonly ConcurrentDictionary<Type, object> _repositories = new();

    public UnitOfWork(DeployDbContext context)
    {
        _context = context;
    }

    public IRepository<T> Repository<T>() where T : class
    {
        return (IRepository<T>)_repositories.GetOrAdd(typeof(T), _ => new Repository<T>(_context));
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);
}
