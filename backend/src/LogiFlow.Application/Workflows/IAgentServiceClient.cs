using LogiFlow.Application.Workflows.DTOs;

namespace LogiFlow.Application.Workflows;

/// <summary>
/// Thin HTTP boundary to the internal Python agent service. The implementation lives
/// in Infrastructure; the Application layer depends only on this abstraction so it
/// stays testable without a real agent.
/// </summary>
public interface IAgentServiceClient
{
    /// <summary>Run the graph up to the human gate and return the proposed plan.</summary>
    Task<AgentRunResponse> RunAsync(AgentRunPayload payload, CancellationToken cancellationToken = default);

    /// <summary>Inject the ops-manager decision and resume the workflow (Phase 4).</summary>
    Task<AgentApprovalResponse> ApproveAsync(
        string workflowKey,
        AgentApprovalRequest request,
        CancellationToken cancellationToken = default);
}
