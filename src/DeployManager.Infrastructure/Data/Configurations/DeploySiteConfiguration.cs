using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeploySiteConfiguration : IEntityTypeConfiguration<DeploySite>
{
    public void Configure(EntityTypeBuilder<DeploySite> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.PhysicalPath).HasMaxLength(500).IsRequired();
        builder.Property(e => e.BackupPath).HasMaxLength(500);

        builder.HasOne(e => e.Environment)
            .WithMany()
            .HasForeignKey(e => e.EnvironmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
