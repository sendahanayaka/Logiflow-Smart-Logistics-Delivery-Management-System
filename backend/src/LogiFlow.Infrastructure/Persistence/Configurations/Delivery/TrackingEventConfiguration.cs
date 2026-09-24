using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Delivery;

public class TrackingEventConfiguration : IEntityTypeConfiguration<TrackingEvent>
{
    public void Configure(EntityTypeBuilder<TrackingEvent> builder)
    {
        builder.ToTable("TrackingEvents");

        builder.HasKey(evt => evt.Id);

        // Timeline is read shipment-by-shipment, ordered by time.
        builder.HasIndex(evt => new { evt.ShipmentId, evt.OccurredAt });
        builder.HasIndex(evt => evt.RouteStopId);

        builder.Property(evt => evt.EventType)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(evt => evt.OccurredAt)
            .IsRequired();

        builder.Property(evt => evt.Note)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(evt => evt.CreatedAt)
            .IsRequired();

        // Relationship to Shipment is configured on the Shipment side.
    }
}
