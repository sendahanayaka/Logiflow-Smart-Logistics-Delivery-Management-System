using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Warehouse;

public class DispatchBatchItemConfiguration : IEntityTypeConfiguration<DispatchBatchItem>
{
    public void Configure(EntityTypeBuilder<DispatchBatchItem> builder)
    {
        builder.ToTable("DispatchBatchItems", table =>
        {
            table.HasCheckConstraint(
                "CK_DispatchBatchItems_LoadSequence_Positive",
                "\"LoadSequence\" > 0");
        });

        builder.HasKey(item => item.Id);

        builder.Property(item => item.LoadSequence)
            .IsRequired();

        builder.HasIndex(item => item.PackageId)
            .IsUnique();

        builder.HasIndex(item => new { item.DispatchBatchId, item.LoadSequence })
            .IsUnique();

        builder.HasOne(item => item.DispatchBatch)
            .WithMany(batch => batch.Items)
            .HasForeignKey(item => item.DispatchBatchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(item => item.Package)
            .WithMany(package => package.DispatchBatchItems)
            .HasForeignKey(item => item.PackageId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
