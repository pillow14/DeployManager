using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class RollbackExecutionConfiguration : IEntityTypeConfiguration<RollbackExecution>
{
    public void Configure(EntityTypeBuilder<RollbackExecution> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
        builder.Property(e => e.Reason).HasMaxLength(500);

        builder.HasOne(e => e.OriginalExecution)
            .WithMany()
            .HasForeignKey(e => e.OriginalExecutionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Site)
            .WithMany()
            .HasForeignKey(e => e.SiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ExecutedByUser)
            .WithMany()
            .HasForeignKey(e => e.ExecutedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(e => e.Details)
            .WithOne(d => d.RollbackExecution)
            .HasForeignKey(d => d.RollbackExecutionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
