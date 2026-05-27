using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeployPackageConfiguration : IEntityTypeConfiguration<DeployPackage>
{
    public void Configure(EntityTypeBuilder<DeployPackage> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.FileName).HasMaxLength(500).IsRequired();
        builder.Property(e => e.StoredPath).HasMaxLength(1000).IsRequired();
        builder.Property(e => e.Status).HasMaxLength(50).IsRequired();
        builder.HasOne(e => e.Site)
            .WithMany()
            .HasForeignKey(e => e.SiteId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
