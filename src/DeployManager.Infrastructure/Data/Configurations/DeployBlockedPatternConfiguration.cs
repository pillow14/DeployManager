using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeployBlockedPatternConfiguration : IEntityTypeConfiguration<DeployBlockedPattern>
{
    public void Configure(EntityTypeBuilder<DeployBlockedPattern> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Pattern).HasMaxLength(500).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(500);
        builder.HasIndex(e => e.Pattern).IsUnique();
    }
}
