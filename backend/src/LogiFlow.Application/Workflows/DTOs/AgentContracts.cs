namespace LogiFlow.Application.Workflows.DTOs;

// Wire contracts for the internal Python agent service. The client configures
// JsonNamingPolicy.SnakeCaseLower, so PascalCase here maps to snake_case on the
// wire (e.g. WorkflowId <-> workflow_id, StopId <-> stop_id).

/// <summary>Body for <c>POST /workflow/run</c>: the agent wraps the payload.</summary>
public sealed record AgentRunRequest(AgentRunPayload Payload);

public sealed record AgentRunPayload(
    string WorkflowId,
    string Objective,
    string? DeliveryWindowStart,
    string? CustomerNotes,
    IReadOnlyList<string> OrderIds,
    IReadOnlyList<AgentStop> Stops);

public sealed record AgentStop(
    string StopId,
    string OrderId,
    string Address,
    double Lat,
    double Lng,
    string? WindowStart,
    string? WindowEnd);

/// <summary>Response from <c>POST /workflow/run</c>.</summary>
public sealed record AgentRunResponse(
    string WorkflowId,
    string? Status,
    AgentProposal? Proposal,
    IReadOnlyList<AgentAuditEntry>? Audit,
    IReadOnlyList<AgentError>? Errors);

// Only the routing block is strongly typed; the upstream S1/S2/S3 blocks are kept
// verbatim in the stored JSON and not modelled here.
public sealed record AgentProposal(AgentRoutingOutput? Routing);

public sealed record AgentRoutingOutput(
    string WorkflowId,
    IReadOnlyList<AgentSequencedStop> SequencedStops,
    double TotalDistanceKm,
    double TotalDurationMin,
    IReadOnlyList<AgentNotification> NotificationPlan);

public sealed record AgentSequencedStop(
    int Sequence,
    string StopId,
    string Eta,
    double DistanceFromPrevKm);

public sealed record AgentNotification(string Trigger, string Channel, string Message);

public sealed record AgentAuditEntry(
    string Step,
    string Agent,
    string Summary,
    IReadOnlyList<string>? ToolCalls,
    int? DurationMs,
    bool Ok);

public sealed record AgentError(string Step, string Message, bool Recoverable);

/// <summary>Body for <c>POST /workflow/{id}/approval</c> (used from Phase 4).</summary>
public sealed record AgentApprovalRequest(
    string Action,
    string DecidedBy,
    string? Reason,
    IReadOnlyDictionary<string, object>? Revisions);

public sealed record AgentApprovalResponse(
    string WorkflowId,
    string? Status,
    string? Outcome,
    IReadOnlyList<AgentAuditEntry>? Audit);
