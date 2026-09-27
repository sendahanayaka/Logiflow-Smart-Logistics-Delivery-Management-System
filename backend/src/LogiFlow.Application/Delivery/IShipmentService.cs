// [S4]  shipment service contract
using LogiFlow.Application.Delivery.DTOs;

namespace LogiFlow.Application.Delivery;

public interface IShipmentService
{
    /// <summary>Customer / ops live-tracking timeline for a shipment (null if not found).</summary>
    Task<TrackingView?> GetTrackingAsync(Guid shipmentId, CancellationToken cancellationToken = default);

    /// <summary>The driver's assigned run (ordered stops + statuses + ETAs), null if not found.</summary>
    Task<DriverRunView?> GetDriverRunAsync(Guid shipmentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Record driver progress at a stop. An ARRIVED event recomputes the downstream ETAs
    /// from the actual arrival time (the tracking-timeline recompute).
    /// </summary>
    Task<TrackingView> RecordStopEventAsync(
        Guid shipmentId, RecordStopEventCommand command, CancellationToken cancellationToken = default);

    /// <summary>Capture proof of delivery for a stop; completes the shipment when all stops are delivered.</summary>
    Task<TrackingView> RecordProofOfDeliveryAsync(
        Guid shipmentId, RecordPodCommand command, CancellationToken cancellationToken = default);
}
