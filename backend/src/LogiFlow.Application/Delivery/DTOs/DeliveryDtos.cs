namespace LogiFlow.Application.Delivery.DTOs;

/// <summary>One ordered stop entering the ETA engine.</summary>
public sealed record EtaStop(
    string StopKey,
    double Latitude,
    double Longitude,
    double DistanceFromPrevKm,
    DateTime? WindowStart,
    DateTime? WindowEnd);

/// <summary>A stop stamped with its computed ETA.</summary>
public sealed record StopEta(
    string StopKey,
    DateTime Eta,
    double CumulativeMinutes,
    bool? OnTime);

/// <summary>
/// Result of server-side re-validation. Hard <see cref="Issues"/> mean the plan is
/// physically/logically impossible (Ok = false); <see cref="Warnings"/> are feasibility
/// notes (e.g. a stop outside its window) that an ops manager should see but that don't
/// invalidate the data.
/// </summary>
public sealed record PlanValidation(bool Ok, IReadOnlyList<string> Issues, IReadOnlyList<string> Warnings);

/// <summary>A planned stop feeding the tracking timeline.</summary>
public sealed record TimelineStop(
    int Sequence,
    string StopKey,
    string Address,
    DateTime PlannedEta,
    string Status,
    bool? OnTime = null,
    double Latitude = 0,
    double Longitude = 0);

/// <summary>An actual tracking event recorded against a run.</summary>
public sealed record TimelineEvent(
    int? Sequence,
    string EventType,
    DateTime OccurredAt,
    string? Note);

/// <summary>One row of the customer/driver tracking timeline (planned + actual).</summary>
public sealed record TimelineEntry(
    int Sequence,
    string StopKey,
    string Address,
    DateTime PlannedEta,
    string Status,
    DateTime? ActualAt,
    string? Note,
    bool? OnTime = null,
    double Latitude = 0,
    double Longitude = 0,
    // Driver-run extras (null/0 on the customer timeline): who to hand over to +
    // the leg distance to this stop.
    decimal DistanceFromPrevKm = 0,
    string? RecipientName = null,
    string? RecipientContact = null);

// --- Phase 5 views + commands ------------------------------------------------

/// <summary>Customer / ops live-tracking view of a shipment.</summary>
public sealed record TrackingView(
    Guid ShipmentId,
    string ShipmentCode,
    string Status,
    IReadOnlyList<TimelineEntry> Stops);

/// <summary>Driver's assigned run.</summary>
public sealed record DriverRunView(
    Guid ShipmentId,
    string ShipmentCode,
    string Status,
    Guid DriverId,
    Guid VehicleId,
    IReadOnlyList<TimelineEntry> Stops);

/// <summary>Driver reports progress at a stop; ARRIVED triggers a downstream ETA recompute.</summary>
public sealed record RecordStopEventCommand(
    string StopKey,
    string Kind,               // ARRIVED | DEPARTED
    DateTime? OccurredAt,
    string? Note,
    double? Latitude,
    double? Longitude);

/// <summary>Proof of delivery captured at a stop.</summary>
public sealed record RecordPodCommand(
    string StopKey,
    string? ReceivedByName,
    string? SignatureImageUrl,
    string? PhotoUrl,
    string? Notes,
    DateTime? DeliveredAt);

/// <summary>
/// Customer-facing tracking for one order: the shipment status + the assigned driver's
/// contact + just THIS order's stop (never other customers on the same van).
/// </summary>
public sealed record CustomerOrderTrackingView(
    Guid OrderId,
    bool HasShipment,
    string Stage,                 // Preparing | AwaitingDispatch | Dispatched | ...
    string? ShipmentCode,
    string? ShipmentStatus,
    string? DriverName,
    string? DriverContact,
    string? VehicleRegistration,
    int? StopSequence,
    DateTime? Eta,
    string? StopStatus,
    bool? OnTime,
    DateTime? ArrivedAt,
    DateTime? DeliveredAt,
    string? ReceivedByName,
    // Map coordinates (item 11): the run origin (first stop) and this order's
    // delivery point, for the customer's live tracking map. 0 when not geocoded.
    double? OriginLat = null,
    double? OriginLng = null,
    double? DestinationLat = null,
    double? DestinationLng = null);

/// <summary>Lightweight shipment row for the admin shipments list.</summary>
public sealed record ShipmentSummary(
    Guid Id,
    string ShipmentCode,
    string Status,
    Guid DriverId,
    Guid VehicleId,
    decimal TotalDistanceKm,
    int StopCount,
    int DeliveredCount,
    DateTime? DispatchedAt,
    DateTime CreatedAt);
