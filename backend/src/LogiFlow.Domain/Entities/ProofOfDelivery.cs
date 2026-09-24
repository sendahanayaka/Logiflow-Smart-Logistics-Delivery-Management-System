// [S4]  entity
namespace LogiFlow.Domain.Entities;

/// <summary>
/// Proof captured when a stop is delivered (signature, photo, recipient). Belongs to
/// a shipment and references the delivered stop by id.
/// </summary>
public class ProofOfDelivery
{
    public Guid Id { get; set; }
    public Guid ShipmentId { get; set; }
    public Guid RouteStopId { get; set; }

    public string? ReceivedByName { get; set; }
    public string? SignatureImageUrl { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Notes { get; set; }

    public DateTime DeliveredAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Shipment Shipment { get; set; } = null!;
}
