using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeployEnvironmentConfiguration : IEntityTypeConfiguration<DeployEnvironment>
{
    public void Configure(EntityTypeBuilder<DeployEnvironment> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.TargetUrl).HasMaxLength(500).IsRequired();
        builder.Property(e => e.CredentialKey).HasMaxLength(500);
    }
}
