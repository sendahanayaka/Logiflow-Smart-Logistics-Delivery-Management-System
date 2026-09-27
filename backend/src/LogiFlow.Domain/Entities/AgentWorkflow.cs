// [S4]  entity
using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

/// <summary>
/// A single run of the Python routing agent and its lifecycle in the backend.
/// The agent proposes a plan; the backend re-validates it, an ops manager approves
/// it, and on approval it becomes a <see cref="Shipment"/>. The raw agent output is
/// kept verbatim for traceability, but the authoritative numbers live on
/// <see cref="RouteStop"/> / <see cref="Shipment"/>.
/// </summary>
public class AgentWorkflow
{
    public Guid Id { get; set; }

    /// <summary>Correlation id shared with the agent service (its <c>workflow_id</c>).</summary>
    public string WorkflowKey { get; set; } = string.Empty;

    // What triggered routing: a dispatch batch assembled by S3.
    // TODO(S3): swap to a DispatchBatch FK/navigation once S3 publishes its contract.
    public Guid DispatchBatchId { get; set; }

    public WorkflowStatus Status { get; set; } = WorkflowStatus.Pending;

    public string? Objective { get; set; }

    /// <summary>Human-readable narration the agent's LLM wrote for the approval screen.</summary>
    public string? Summary { get; set; }

    /// <summary>Raw <c>RoutingOutput</c> the agent proposed, stored as JSON (jsonb).</summary>
    public string? ProposedPlanJson { get; set; }

    /// <summary>The agent's audit trail, stored as JSON (jsonb).</summary>
    public string? AuditJson { get; set; }

    /// <summary>Populated when <see cref="Status"/> is <c>Failed</c> (safe-failure path).</summary>
    public string? Error { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<RouteStop> RouteStops { get; set; } = new List<RouteStop>();
    public ICollection<ApprovalDecision> ApprovalDecisions { get; set; } = new List<ApprovalDecision>();
    public Shipment? Shipment { get; set; }
}
