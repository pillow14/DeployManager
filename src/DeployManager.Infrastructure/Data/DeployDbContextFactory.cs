using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using DeployManager.Infrastructure.Data;

namespace DeployManager.Infrastructure;

public class DeployDbContextFactory : IDesignTimeDbContextFactory<DeployDbContext>
{
    public DeployDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<DeployDbContext>();
        optionsBuilder.UseSqlServer("Server=.;Database=DeployManagerDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true");
        return new DeployDbContext(optionsBuilder.Options);
    }
}
