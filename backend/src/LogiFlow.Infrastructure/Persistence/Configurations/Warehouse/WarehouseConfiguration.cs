using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WarehouseEntity = LogiFlow.Domain.Entities.Warehouse;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Warehouse;

public class WarehouseConfiguration : IEntityTypeConfiguration<WarehouseEntity>
{
    public void Configure(EntityTypeBuilder<WarehouseEntity> builder)
    {
        builder.ToTable("Warehouses", table =>
        {
            table.HasCheckConstraint(
                "CK_Warehouses_TotalVolumeM3_Positive",
                "\"TotalVolumeM3\" > 0");
            table.HasCheckConstraint(
                "CK_Warehouses_OccupiedVolumeM3_Valid",
                "\"OccupiedVolumeM3\" >= 0 AND \"OccupiedVolumeM3\" <= \"TotalVolumeM3\"");
        });

        builder.HasKey(warehouse => warehouse.Id);

        builder.Property(warehouse => warehouse.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(warehouse => warehouse.Location)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(warehouse => warehouse.TotalVolumeM3)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(warehouse => warehouse.OccupiedVolumeM3)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(warehouse => warehouse.CreatedAt)
            .IsRequired();

        builder.Property(warehouse => warehouse.UpdatedAt)
            .IsRequired(false);
    }
}
