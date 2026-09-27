using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Fleet;

public class MaintenanceRecordConfiguration : IEntityTypeConfiguration<MaintenanceRecord>
{
    public void Configure(EntityTypeBuilder<MaintenanceRecord> builder)
    {
        builder.ToTable("MaintenanceRecords");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.VehicleId)
            .IsRequired();

        builder.Property(m => m.MaintenanceDate)
            .IsRequired();

        builder.Property(m => m.MaintenanceType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(m => m.Description)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(m => m.Cost)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(m => m.NextMaintenanceDate)
            .IsRequired(false);

        builder.Property(m => m.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(m => m.CreatedAt)
            .IsRequired();

        builder.Property(m => m.UpdatedAt)
            .IsRequired(false);

        // Indexes
        builder.HasIndex(m => m.VehicleId);
        builder.HasIndex(m => m.Status);
        builder.HasIndex(m => m.MaintenanceDate);

        // Foreign Key Relationship
        builder.HasOne(m => m.Vehicle)
            .WithMany()
            .HasForeignKey(m => m.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
