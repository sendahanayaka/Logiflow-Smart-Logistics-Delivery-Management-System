namespace LogiFlow.Api.DTOs.Workflows;

/// <summary>Request to trigger the routing agent for a dispatch batch's stops.</summary>
public sealed record TriggerWorkflowRequest(
    Guid DispatchBatchId,
    string? Objective,
    DateTime? DeliveryWindowStart,
    string? CustomerNotes,
    List<TriggerWorkflowStop> Stops);

public sealed record TriggerWorkflowStop(
    string StopKey,
    Guid OrderId,
    string Address,
    double Latitude,
    double Longitude,
    DateTime? WindowStart,
    DateTime? WindowEnd);
