using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeployRuleConfiguration : IEntityTypeConfiguration<DeployRule>
{
    public void Configure(EntityTypeBuilder<DeployRule> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.SourcePattern).HasMaxLength(500).IsRequired();
        builder.Property(e => e.DestinationPath).HasMaxLength(500).IsRequired();
        builder.Property(e => e.Action).HasMaxLength(50).IsRequired();
    }
}
