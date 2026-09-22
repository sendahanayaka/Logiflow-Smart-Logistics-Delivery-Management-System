using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Warehouse;

public class StorageZoneConfiguration : IEntityTypeConfiguration<StorageZone>
{
    public void Configure(EntityTypeBuilder<StorageZone> builder)
    {
        builder.ToTable("StorageZones", table =>
        {
            table.HasCheckConstraint(
                "CK_StorageZones_TotalVolumeM3_Positive",
                "\"TotalVolumeM3\" > 0");
            table.HasCheckConstraint(
                "CK_StorageZones_OccupiedVolumeM3_Valid",
                "\"OccupiedVolumeM3\" >= 0 AND \"OccupiedVolumeM3\" <= \"TotalVolumeM3\"");
        });

        builder.HasKey(zone => zone.Id);

        builder.Property(zone => zone.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(zone => zone.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(zone => new { zone.WarehouseId, zone.Code })
            .IsUnique();

        builder.Property(zone => zone.TotalVolumeM3)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(zone => zone.OccupiedVolumeM3)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(zone => zone.CreatedAt)
            .IsRequired();

        builder.Property(zone => zone.UpdatedAt)
            .IsRequired(false);

        builder.HasOne(zone => zone.Warehouse)
            .WithMany(warehouse => warehouse.StorageZones)
            .HasForeignKey(zone => zone.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
