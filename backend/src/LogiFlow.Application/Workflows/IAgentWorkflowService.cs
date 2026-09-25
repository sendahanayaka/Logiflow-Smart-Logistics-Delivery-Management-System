// [S4]  agent workflow contract
using LogiFlow.Application.Workflows.DTOs;

namespace LogiFlow.Application.Workflows;

public interface IAgentWorkflowService
{
    /// <summary>
    /// Trigger a routing run: build the agent payload, call the agent, and persist the
    /// proposed plan (workflow + route stops) in state AwaitingApproval.
    /// </summary>
    Task<WorkflowResponse> RunWorkflowAsync(
        RunWorkflowCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>Fetch a persisted workflow and its route stops, or null if not found.</summary>
    Task<WorkflowResponse?> GetWorkflowAsync(Guid id, CancellationToken cancellationToken = default);
}
