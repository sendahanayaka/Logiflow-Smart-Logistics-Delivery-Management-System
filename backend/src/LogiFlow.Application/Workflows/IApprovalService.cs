using LogiFlow.Application.Workflows.DTOs;

namespace LogiFlow.Application.Workflows;

public interface IApprovalService
{
    /// <summary>
    /// Apply an ops-manager decision to a workflow that is awaiting approval:
    /// APPROVE dispatches (resumes the agent, creates the Shipment + first tracking
    /// event), REJECT ends it, REVISE records the requested changes and keeps it
    /// awaiting. Returns the resulting status (and the shipment on approval).
    /// </summary>
    Task<ApprovalResult> DecideAsync(
        Guid workflowId,
        ApproveWorkflowCommand command,
        CancellationToken cancellationToken = default);
}
