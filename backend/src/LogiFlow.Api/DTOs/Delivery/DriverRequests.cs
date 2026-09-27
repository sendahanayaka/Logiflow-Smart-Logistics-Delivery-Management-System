namespace LogiFlow.Api.DTOs.Delivery;

/// <summary>Driver reports progress at a stop. Kind is "ARRIVED" or "DEPARTED".</summary>
public sealed record RecordStopEventRequest(
    string StopKey,
    string Kind,
    DateTime? OccurredAt,
    string? Note,
    double? Latitude,
    double? Longitude);

/// <summary>Proof of delivery captured at a stop.</summary>
public sealed record RecordPodRequest(
    string StopKey,
    string? ReceivedByName,
    string? SignatureImageUrl,
    string? PhotoUrl,
    string? Notes,
    DateTime? DeliveredAt);
