namespace LogiFlow.Application.Workflows.DTOs;

/// <summary>Application command to trigger a routing workflow for a dispatch batch.</summary>
public sealed record RunWorkflowCommand(
    Guid DispatchBatchId,
    string? Objective,
    DateTime? DeliveryWindowStart,
    string? CustomerNotes,
    IReadOnlyList<RunWorkflowStop> Stops,
    // The vehicle the batch is already committed to (warehouse pick). The allocation
    // agent honours it so its choice matches the batch → S3 validation passes.
    string? RequiredVehicleId = null);

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
    IReadOnlyList<RouteStopResponse> Stops,
    Guid? AllocatedDriverId = null,
    Guid? AllocatedVehicleId = null,
    string? AllocationSummary = null,
    // The agent's per-step audit trail (Plan → Allocate → Validate → Route →
    // Execute), parsed from the stored AuditJson for the viva/monitor views.
    IReadOnlyList<AgentStepResponse>? AgentSteps = null);

/// <summary>One agent step in the workflow's audit trail (items 9 & 10).</summary>
public sealed record AgentStepResponse(
    string Step,
    string Agent,
    string Summary,
    IReadOnlyList<string> ToolCalls,
    int? DurationMs,
    bool Ok);

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

/// <summary>Lightweight workflow row for the admin monitor / approval queue.</summary>
public sealed record WorkflowSummary(
    Guid Id,
    string WorkflowKey,
    string Status,
    string? Objective,
    string? Summary,
    int StopCount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
