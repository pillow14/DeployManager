using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using DeployManager.Domain.Entities;

namespace DeployManager.Infrastructure.Data.Configurations;

public class RollbackExecutionDetailConfiguration : IEntityTypeConfiguration<RollbackExecutionDetail>
{
    public void Configure(EntityTypeBuilder<RollbackExecutionDetail> builder)
    {
        builder.HasKey(e => e.Id);
        builder.Property(e => e.RelativePath).HasMaxLength(1000).IsRequired();
        builder.Property(e => e.Action).HasMaxLength(100);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(50);
    }
}
