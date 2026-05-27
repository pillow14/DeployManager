using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeployJobConfiguration : IEntityTypeConfiguration<DeployJob>
{
    public void Configure(EntityTypeBuilder<DeployJob> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.FileName).HasMaxLength(500).IsRequired();
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);

        builder.HasOne(e => e.Site)
            .WithMany()
            .HasForeignKey(e => e.SiteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Package)
            .WithMany()
            .HasForeignKey(e => e.PackageId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.CreatedByUser)
            .WithMany()
            .HasForeignKey(e => e.CreatedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
