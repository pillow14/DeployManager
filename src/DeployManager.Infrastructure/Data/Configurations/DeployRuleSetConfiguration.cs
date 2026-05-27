using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeployRuleSetConfiguration : IEntityTypeConfiguration<DeployRuleSet>
{
    public void Configure(EntityTypeBuilder<DeployRuleSet> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Code).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.HasIndex(e => e.Code).IsUnique();

        builder.HasOne(e => e.DeploymentMode)
            .WithMany(d => d.RuleSets)
            .HasForeignKey(e => e.DeploymentModeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
