using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Delivery;

public class ProofOfDeliveryConfiguration : IEntityTypeConfiguration<ProofOfDelivery>
{
    public void Configure(EntityTypeBuilder<ProofOfDelivery> builder)
    {
        builder.ToTable("ProofOfDeliveries");

        builder.HasKey(pod => pod.Id);

        builder.HasIndex(pod => pod.ShipmentId);

        // At most one proof per stop.
        builder.HasIndex(pod => pod.RouteStopId)
            .IsUnique();

        builder.Property(pod => pod.ReceivedByName)
            .HasMaxLength(200)
            .IsRequired(false);

        builder.Property(pod => pod.SignatureImageUrl)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(pod => pod.PhotoUrl)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(pod => pod.Notes)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(pod => pod.DeliveredAt)
            .IsRequired();

        builder.Property(pod => pod.CreatedAt)
            .IsRequired();

        // Relationship to Shipment is configured on the Shipment side.
    }
}
