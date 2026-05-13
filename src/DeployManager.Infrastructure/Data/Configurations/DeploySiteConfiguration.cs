using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeploySiteConfiguration : IEntityTypeConfiguration<DeploySite>
{
    public void Configure(EntityTypeBuilder<DeploySite> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Code).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Name).HasMaxLength(200).IsRequired();
        builder.Property(e => e.RootPath).HasMaxLength(500).IsRequired();
        builder.Property(e => e.PublicUrl).HasMaxLength(500);
        builder.Property(e => e.Username).HasMaxLength(200);
        builder.Property(e => e.PasswordEncrypted).HasMaxLength(500);
        builder.Property(e => e.TargetType).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.HasIndex(e => e.Code).IsUnique();
        builder.HasOne(e => e.Environment)
            .WithMany()
            .HasForeignKey(e => e.EnvironmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
