// [S4]  shipment service contract
using LogiFlow.Application.Delivery.DTOs;

namespace LogiFlow.Application.Delivery;

public interface IShipmentService
{
    /// <summary>List dispatched shipments for the admin shipments view, newest first.</summary>
    Task<IReadOnlyList<ShipmentSummary>> ListShipmentsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// The signed-in driver's own assigned runs (resolved via the driver's linked account).
    /// Returns an empty list when the caller has no linked driver profile.
    /// </summary>
    Task<IReadOnlyList<ShipmentSummary>> GetMyRunsAsync(CancellationToken cancellationToken = default);

    /// <summary>Customer / ops live-tracking timeline for a shipment (null if not found).</summary>
    Task<TrackingView?> GetTrackingAsync(Guid shipmentId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Customer-facing tracking for one of their orders: shipment status + assigned
    /// driver's contact + this order's own stop. Returns a "preparing" view when the
    /// order isn't routed/dispatched yet.
    /// </summary>
    Task<CustomerOrderTrackingView> GetOrderTrackingAsync(Guid orderId, CancellationToken cancellationToken = default);

    /// <summary>Live-tracking timeline looked up by the friendly shipment code (null if not found).</summary>
    Task<TrackingView?> GetTrackingByCodeAsync(string shipmentCode, CancellationToken cancellationToken = default);

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
