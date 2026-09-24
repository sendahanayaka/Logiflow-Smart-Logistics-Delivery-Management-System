// [S4]  entity
using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

/// <summary>
/// A dispatched delivery run, created from an approved <see cref="AgentWorkflow"/>.
/// It carries the run-level totals and is the anchor for tracking events and proofs
/// of delivery.
/// </summary>
public class Shipment
{
    public Guid Id { get; set; }
    public Guid AgentWorkflowId { get; set; }

    public string ShipmentCode { get; set; } = string.Empty;

    // TODO(S2): link to Driver/Vehicle once S2 publishes its contract.
    public Guid DriverId { get; set; }
    public Guid VehicleId { get; set; }

    public ShipmentStatus Status { get; set; } = ShipmentStatus.Created;

    public decimal TotalDistanceKm { get; set; }
    public decimal TotalDurationMin { get; set; }

    public DateTime PlannedStartAt { get; set; }
    public DateTime? DispatchedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public AgentWorkflow AgentWorkflow { get; set; } = null!;
    public ICollection<TrackingEvent> TrackingEvents { get; set; } = new List<TrackingEvent>();
    public ICollection<ProofOfDelivery> ProofOfDeliveries { get; set; } = new List<ProofOfDelivery>();
}
