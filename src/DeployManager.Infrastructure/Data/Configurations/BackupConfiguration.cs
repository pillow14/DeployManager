using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class BackupConfiguration : IEntityTypeConfiguration<Backup>
{
    public void Configure(EntityTypeBuilder<Backup> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.FilePath).HasMaxLength(1000).IsRequired();

        builder.HasOne(e => e.DeployJob)
            .WithMany()
            .HasForeignKey(e => e.DeployJobId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
