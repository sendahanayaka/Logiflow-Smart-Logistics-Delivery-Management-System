using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Warehouse;

public class DispatchBatchConfiguration : IEntityTypeConfiguration<DispatchBatch>
{
    public void Configure(EntityTypeBuilder<DispatchBatch> builder)
    {
        builder.ToTable("DispatchBatches", table =>
        {
            table.HasCheckConstraint(
                "CK_DispatchBatches_MaxWeightKg_Positive",
                "\"MaxWeightKg\" > 0");
            table.HasCheckConstraint(
                "CK_DispatchBatches_MaxVolumeM3_Positive",
                "\"MaxVolumeM3\" > 0");
        });

        builder.HasKey(batch => batch.Id);

        builder.Property(batch => batch.VehicleId)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(batch => batch.MaxWeightKg)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(batch => batch.MaxVolumeM3)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(batch => batch.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(batch => batch.CreatedAt)
            .IsRequired();

        builder.Property(batch => batch.UpdatedAt)
            .IsRequired(false);

        builder.HasIndex(batch => batch.WarehouseId);
        builder.HasIndex(batch => batch.VehicleId);

        builder.HasOne(batch => batch.Warehouse)
            .WithMany(warehouse => warehouse.DispatchBatches)
            .HasForeignKey(batch => batch.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
