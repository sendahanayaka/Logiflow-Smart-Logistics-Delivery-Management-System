using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Warehouse;

public class PackageConfiguration : IEntityTypeConfiguration<Package>
{
    public void Configure(EntityTypeBuilder<Package> builder)
    {
        builder.ToTable("Packages", table =>
        {
            table.HasCheckConstraint("CK_Packages_WeightKg_Positive", "\"WeightKg\" > 0");
            table.HasCheckConstraint("CK_Packages_VolumeM3_Positive", "\"VolumeM3\" > 0");
        });

        builder.HasKey(package => package.Id);

        builder.Property(package => package.TrackingCode)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(package => package.TrackingCode)
            .IsUnique();

        builder.HasIndex(package => package.OrderId);
        builder.HasIndex(package => package.WarehouseId);
        builder.HasIndex(package => package.StorageZoneId);

        builder.Property(package => package.WeightKg)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(package => package.VolumeM3)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(package => package.IsFragile)
            .IsRequired();

        builder.Property(package => package.SpecialHandling)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(package => package.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(package => package.ReceivedAt)
            .IsRequired();

        builder.HasOne(package => package.Warehouse)
            .WithMany(warehouse => warehouse.Packages)
            .HasForeignKey(package => package.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(package => package.StorageZone)
            .WithMany(zone => zone.Packages)
            .HasForeignKey(package => package.StorageZoneId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
