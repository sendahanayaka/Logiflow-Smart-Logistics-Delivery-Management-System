// [S4]  entity
using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

/// <summary>
/// An ops manager's decision at the human approval gate. One workflow can accumulate
/// several decisions (e.g. a Revise followed by an Approve), so this is a history.
/// </summary>
public class ApprovalDecision
{
    public Guid Id { get; set; }
    public Guid AgentWorkflowId { get; set; }

    public ApprovalAction Action { get; set; }

    // Who decided. TODO(ALL): link to User once identity is wired; kept as a string
    // to match the agent contract in the meantime.
    public string DecidedBy { get; set; } = string.Empty;

    public string? Reason { get; set; }

    /// <summary>For a Revise action, the requested changes, stored as JSON.</summary>
    public string? RevisionsJson { get; set; }

    public DateTime DecidedAt { get; set; } = DateTime.UtcNow;

    public AgentWorkflow AgentWorkflow { get; set; } = null!;
}
