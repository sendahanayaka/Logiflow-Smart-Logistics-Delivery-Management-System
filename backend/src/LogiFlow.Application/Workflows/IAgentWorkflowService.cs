// [S4]  agent workflow contract
using LogiFlow.Application.Workflows.DTOs;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Workflows;

public interface IAgentWorkflowService
{
    /// <summary>List workflows for the admin monitor / approval queue, newest first.</summary>
    Task<IReadOnlyList<WorkflowSummary>> ListWorkflowsAsync(
        WorkflowStatus? status = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Trigger a routing run: build the agent payload, call the agent, and persist the
    /// proposed plan (workflow + route stops) in state AwaitingApproval.
    /// </summary>
    Task<WorkflowResponse> RunWorkflowAsync(
        RunWorkflowCommand command,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Trigger routing for an already-grouped dispatch batch (group-first): resolve the
    /// batch's packages → delivery orders → stops, then run the workflow. This is the
    /// link from warehouse dispatch to the ops-manager approval queue.
    /// </summary>
    Task<WorkflowResponse> RunWorkflowForBatchAsync(
        Guid dispatchBatchId,
        string? objective,
        CancellationToken cancellationToken = default);

    /// <summary>Fetch a persisted workflow and its route stops, or null if not found.</summary>
    Task<WorkflowResponse?> GetWorkflowAsync(Guid id, CancellationToken cancellationToken = default);
}
