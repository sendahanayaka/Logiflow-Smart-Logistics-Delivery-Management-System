using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Fleet;

public class AssignmentHistoryConfiguration : IEntityTypeConfiguration<AssignmentHistory>
{
    public void Configure(EntityTypeBuilder<AssignmentHistory> builder)
    {
        builder.ToTable("AssignmentHistories");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.DriverId)
            .IsRequired();

        builder.Property(a => a.VehicleId)
            .IsRequired();

        builder.Property(a => a.AssignedAt)
            .IsRequired();

        builder.Property(a => a.UnassignedAt)
            .IsRequired(false);

        builder.Property(a => a.IsActive)
            .IsRequired();

        builder.Property(a => a.Notes)
            .HasMaxLength(500)
            .IsRequired(false);

        // Single Indexes
        builder.HasIndex(a => a.DriverId);
        builder.HasIndex(a => a.VehicleId);
        builder.HasIndex(a => a.IsActive);

        // Composite Indexes for active assignment lookups
        builder.HasIndex(a => new { a.DriverId, a.IsActive });
        builder.HasIndex(a => new { a.VehicleId, a.IsActive });

        // Relationships & Foreign Key Delete Behavior (Restrict prevents cascade delete)
        builder.HasOne(a => a.Driver)
            .WithMany()
            .HasForeignKey(a => a.DriverId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Vehicle)
            .WithMany()
            .HasForeignKey(a => a.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
