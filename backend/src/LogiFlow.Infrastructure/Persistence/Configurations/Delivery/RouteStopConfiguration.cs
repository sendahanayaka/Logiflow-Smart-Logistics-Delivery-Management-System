using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Delivery;

public class RouteStopConfiguration : IEntityTypeConfiguration<RouteStop>
{
    public void Configure(EntityTypeBuilder<RouteStop> builder)
    {
        builder.ToTable("RouteStops", table =>
        {
            table.HasCheckConstraint("CK_RouteStops_Sequence_Positive", "\"Sequence\" > 0");
            table.HasCheckConstraint(
                "CK_RouteStops_DistanceFromPrevKm_NonNegative",
                "\"DistanceFromPrevKm\" >= 0");
        });

        builder.HasKey(stop => stop.Id);

        builder.Property(stop => stop.StopKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(stop => stop.OrderId);

        // One sequence position per workflow.
        builder.HasIndex(stop => new { stop.AgentWorkflowId, stop.Sequence })
            .IsUnique();

        builder.Property(stop => stop.Address)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(stop => stop.DistanceFromPrevKm)
            .IsRequired()
            .HasPrecision(18, 3);

        builder.Property(stop => stop.Eta)
            .IsRequired();

        builder.Property(stop => stop.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(stop => stop.CreatedAt)
            .IsRequired();

        builder.Property(stop => stop.UpdatedAt)
            .IsRequired(false);

        // Relationship to AgentWorkflow is configured on the AgentWorkflow side.
    }
}
