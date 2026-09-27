namespace LogiFlow.Application.Workflows.DTOs;

/// <summary>Application command to trigger a routing workflow for a dispatch batch.</summary>
public sealed record RunWorkflowCommand(
    Guid DispatchBatchId,
    string? Objective,
    DateTime? DeliveryWindowStart,
    string? CustomerNotes,
    IReadOnlyList<RunWorkflowStop> Stops);

public sealed record RunWorkflowStop(
    string StopKey,
    Guid OrderId,
    string Address,
    double Latitude,
    double Longitude,
    DateTime? WindowStart,
    DateTime? WindowEnd);

public sealed record WorkflowResponse(
    Guid Id,
    string WorkflowKey,
    Guid DispatchBatchId,
    string Status,
    string? Objective,
    string? Summary,
    decimal TotalDistanceKm,
    int StopCount,
    DateTime CreatedAt,
    IReadOnlyList<RouteStopResponse> Stops);

public sealed record RouteStopResponse(
    Guid Id,
    int Sequence,
    string StopKey,
    Guid OrderId,
    string Address,
    double Latitude,
    double Longitude,
    decimal DistanceFromPrevKm,
    DateTime Eta,
    DateTime? WindowStart,
    DateTime? WindowEnd,
    bool? OnTime,
    string Status);

/// <summary>An ops-manager decision at the approval gate.</summary>
public sealed record ApproveWorkflowCommand(
    LogiFlow.Domain.Enums.ApprovalAction Action,
    string DecidedBy,
    string? Reason,
    IReadOnlyDictionary<string, object>? Revisions,
    Guid? DriverId,
    Guid? VehicleId);

/// <summary>Outcome of an approval decision.</summary>
public sealed record ApprovalResult(
    Guid WorkflowId,
    string Status,
    Guid? ShipmentId,
    string? ShipmentCode,
    string Message);
