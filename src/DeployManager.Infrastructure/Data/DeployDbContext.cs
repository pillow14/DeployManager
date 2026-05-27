using Microsoft.EntityFrameworkCore;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data;

public class DeployDbContext : DbContext
{
    public DeployDbContext(DbContextOptions<DeployDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<DeployEnvironment> Environments => Set<DeployEnvironment>();
    public DbSet<DeploySite> Sites => Set<DeploySite>();
    public DbSet<DeployRule> Rules => Set<DeployRule>();
    public DbSet<DeployJob> DeployJobs => Set<DeployJob>();
    public DbSet<DeployLog> DeployLogs => Set<DeployLog>();
    public DbSet<Backup> Backups => Set<Backup>();
    public DbSet<DeployPackage> Packages => Set<DeployPackage>();
    public DbSet<DeploymentMode> DeploymentModes => Set<DeploymentMode>();
    public DbSet<DeployRuleSet> RuleSets => Set<DeployRuleSet>();
    public DbSet<DeployBlockedPattern> BlockedPatterns => Set<DeployBlockedPattern>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DeployDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
