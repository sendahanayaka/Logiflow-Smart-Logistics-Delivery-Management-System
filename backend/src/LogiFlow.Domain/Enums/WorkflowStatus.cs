// [S4]  enum
namespace LogiFlow.Domain.Enums;

/// <summary>
/// Lifecycle of an agent routing workflow, mirroring the Python agent's states so
/// the backend can map its responses 1:1. The human gate sits at
/// <see cref="AwaitingApproval"/>; <see cref="Failed"/> is the safe-failure path.
/// </summary>
public enum WorkflowStatus
{
    Pending = 0,           // created in the backend, not yet sent to the agent
    Planning = 1,          // agent is computing the route/ETAs
    AwaitingApproval = 2,  // agent paused at the human approval gate
    Approved = 3,          // ops manager approved; dispatch in progress
    Rejected = 4,          // ops manager rejected the plan
    Completed = 5,         // approved and dispatched successfully
    Failed = 6             // agent or backend error -> needs manual handling
}
