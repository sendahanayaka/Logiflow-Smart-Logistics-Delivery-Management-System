// [S4]  entity
using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

/// <summary>
/// One entry on a shipment's tracking timeline. Optionally references the stop it
/// concerns (by id only, to keep the object graph simple). Feeds the customer
/// live-tracking view and the driver run.
/// </summary>
public class TrackingEvent
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }

    /// <summary>The stop this event concerns, if any (no navigation by design).</summary>
    public Guid? RouteStopId { get; set; }

    public TrackingEventType EventType { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public string? Note { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Shipment Shipment { get; set; } = null!;
}
