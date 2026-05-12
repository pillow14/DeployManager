using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class DeployLogConfiguration : IEntityTypeConfiguration<DeployLog>
{
    public void Configure(EntityTypeBuilder<DeployLog> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Level).HasMaxLength(50).IsRequired();
        builder.Property(e => e.Message).IsRequired();

        builder.HasOne(e => e.DeployJob)
            .WithMany(j => j.Logs)
            .HasForeignKey(e => e.DeployJobId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
