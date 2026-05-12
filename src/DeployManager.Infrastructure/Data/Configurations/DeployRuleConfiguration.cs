using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeployRuleConfiguration : IEntityTypeConfiguration<DeployRule>
{
    public void Configure(EntityTypeBuilder<DeployRule> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Pattern).HasMaxLength(500).IsRequired();
        builder.Property(e => e.Action).HasMaxLength(100).IsRequired();
    }
}
