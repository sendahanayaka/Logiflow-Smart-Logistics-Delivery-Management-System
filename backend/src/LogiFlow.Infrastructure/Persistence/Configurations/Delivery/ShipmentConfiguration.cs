using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Delivery;

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.ToTable("Shipments", table =>
        {
            table.HasCheckConstraint(
                "CK_Shipments_TotalDistanceKm_NonNegative",
                "\"TotalDistanceKm\" >= 0");
            table.HasCheckConstraint(
                "CK_Shipments_TotalDurationMin_NonNegative",
                "\"TotalDurationMin\" >= 0");
        });

        builder.HasKey(shipment => shipment.Id);

        builder.Property(shipment => shipment.ShipmentCode)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(shipment => shipment.ShipmentCode)
            .IsUnique();

        // One shipment per workflow.
        builder.HasIndex(shipment => shipment.AgentWorkflowId)
            .IsUnique();

        builder.HasIndex(shipment => shipment.DriverId);
        builder.HasIndex(shipment => shipment.VehicleId);

        builder.Property(shipment => shipment.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(shipment => shipment.TotalDistanceKm)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(shipment => shipment.TotalDurationMin)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(shipment => shipment.PlannedStartAt)
            .IsRequired();

        builder.Property(shipment => shipment.DispatchedAt)
            .IsRequired(false);

        builder.Property(shipment => shipment.CompletedAt)
            .IsRequired(false);

        builder.Property(shipment => shipment.CreatedAt)
            .IsRequired();

        builder.Property(shipment => shipment.UpdatedAt)
            .IsRequired(false);

        builder.HasMany(shipment => shipment.TrackingEvents)
            .WithOne(evt => evt.Shipment)
            .HasForeignKey(evt => evt.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(shipment => shipment.ProofOfDeliveries)
            .WithOne(pod => pod.Shipment)
            .HasForeignKey(pod => pod.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relationship to AgentWorkflow is configured on the AgentWorkflow side.
    }
}
