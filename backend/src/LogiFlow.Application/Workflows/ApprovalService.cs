// [S4]  human approval gate service
using System.Text.Json;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Workflows.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace LogiFlow.Application.Workflows;

public class ApprovalService : IApprovalService
{
    private readonly IAppDbContext _context;
    private readonly IAgentServiceClient _agent;
    private readonly ILogger<ApprovalService> _logger;

    public ApprovalService(
        IAppDbContext context,
        IAgentServiceClient agent,
        ILogger<ApprovalService> logger)
    {
        _context = context;
        _agent = agent;
        _logger = logger;
    }

    public async Task<ApprovalResult> DecideAsync(
        Guid workflowId,
        ApproveWorkflowCommand command,
        CancellationToken cancellationToken = default)
    {
        var workflow = await _context.AgentWorkflows
            .Include(item => item.RouteStops)
            .Include(item => item.Shipment)
            .FirstOrDefaultAsync(item => item.Id == workflowId, cancellationToken);

        if (workflow is null)
        {
            throw new KeyNotFoundException($"Workflow '{workflowId}' was not found.");
        }

        // Idempotency guard: only a workflow still at the gate can be decided.
        if (workflow.Status != WorkflowStatus.AwaitingApproval)
        {
            throw new InvalidOperationException(
                $"Workflow '{workflowId}' is '{workflow.Status}', not awaiting approval.");
        }

        RecordDecision(workflow, command);

        var result = command.Action switch
        {
            ApprovalAction.Approve => await ApproveAsync(workflow, command, cancellationToken),
            ApprovalAction.Reject => await RejectAsync(workflow, command, cancellationToken),
            ApprovalAction.Revise => Revise(workflow),
            _ => throw new ArgumentException($"Unknown action '{command.Action}'.", nameof(command))
        };

        workflow.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return result;
    }

    // --- APPROVE: resume the agent, then dispatch a shipment ------------------

    private async Task<ApprovalResult> ApproveAsync(
        AgentWorkflow workflow,
        ApproveWorkflowCommand command,
        CancellationToken cancellationToken)
    {
        if (command.DriverId is null || command.VehicleId is null
            || command.DriverId == Guid.Empty || command.VehicleId == Guid.Empty)
        {
            throw new ArgumentException("Approval requires a driver and a vehicle.", nameof(command));
        }

        var agentResponse = await _agent.ApproveAsync(
            workflow.WorkflowKey,
            new AgentApprovalRequest("APPROVE", command.DecidedBy, command.Reason, command.Revisions),
            cancellationToken);

        var status = MapStatus(agentResponse.Status);
        if (status != WorkflowStatus.Completed)
        {
            // The agent did not complete (e.g. safe-failure on resume): reflect that,
            // do not dispatch a shipment.
            workflow.Status = status;
            workflow.Error ??= $"Agent returned '{agentResponse.Status}' on approval.";
            _logger.LogWarning(
                "Workflow {WorkflowKey}: approve did not complete (agent status {Status}).",
                workflow.WorkflowKey, agentResponse.Status);
            return new ApprovalResult(workflow.Id, workflow.Status.ToString(), null, null,
                "Agent did not complete the run; no shipment created.");
        }

        var stops = workflow.RouteStops.OrderBy(stop => stop.Sequence).ToList();
        var plannedStart = stops.Count > 0 ? stops[0].Eta : DateTime.UtcNow;
        var totalDuration = stops.Count > 0
            ? Math.Round((stops[^1].Eta - plannedStart).TotalMinutes, 2)
            : 0.0;

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            AgentWorkflowId = workflow.Id,
            ShipmentCode = $"SHP-{Guid.NewGuid():N}"[..16],
            DriverId = command.DriverId.Value,
            VehicleId = command.VehicleId.Value,
            Status = ShipmentStatus.Dispatched,
            TotalDistanceKm = stops.Sum(stop => stop.DistanceFromPrevKm),
            TotalDurationMin = (decimal)totalDuration,
            PlannedStartAt = plannedStart,
            DispatchedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        shipment.TrackingEvents.Add(new TrackingEvent
        {
            Id = Guid.NewGuid(),
            ShipmentId = shipment.Id,
            EventType = TrackingEventType.Dispatched,
            OccurredAt = DateTime.UtcNow,
            Note = $"Run dispatched to driver by {command.DecidedBy}.",
            CreatedAt = DateTime.UtcNow
        });

        _context.Shipments.Add(shipment);
        workflow.Status = WorkflowStatus.Completed;

        _logger.LogInformation(
            "Workflow {WorkflowKey} approved by {DecidedBy}; shipment {ShipmentCode} dispatched.",
            workflow.WorkflowKey, command.DecidedBy, shipment.ShipmentCode);

        return new ApprovalResult(workflow.Id, workflow.Status.ToString(), shipment.Id, shipment.ShipmentCode,
            "Approved and dispatched.");
    }

    // --- REJECT: resume the agent to its rejected end state -------------------

    private async Task<ApprovalResult> RejectAsync(
        AgentWorkflow workflow,
        ApproveWorkflowCommand command,
        CancellationToken cancellationToken)
    {
        await _agent.ApproveAsync(
            workflow.WorkflowKey,
            new AgentApprovalRequest("REJECT", command.DecidedBy, command.Reason, command.Revisions),
            cancellationToken);

        workflow.Status = WorkflowStatus.Rejected;
        _logger.LogInformation(
            "Workflow {WorkflowKey} rejected by {DecidedBy}.", workflow.WorkflowKey, command.DecidedBy);
        return new ApprovalResult(workflow.Id, workflow.Status.ToString(), null, null, "Rejected.");
    }

    // --- REVISE: record the requested changes, keep it awaiting ---------------

    private ApprovalResult Revise(AgentWorkflow workflow)
    {
        // The current agent has no revise-and-replan loop, so we do NOT resume it
        // (resuming would reject it). We record the revision request and leave the
        // workflow awaiting a revised plan / re-approval.
        _logger.LogInformation(
            "Workflow {WorkflowKey}: revision requested; kept awaiting approval.", workflow.WorkflowKey);
        return new ApprovalResult(workflow.Id, workflow.Status.ToString(), null, null,
            "Revision requested; workflow kept awaiting approval.");
    }

    // --- helpers --------------------------------------------------------------

    private void RecordDecision(AgentWorkflow workflow, ApproveWorkflowCommand command)
    {
        // Add via the DbSet (forces Added state). Adding to the tracked workflow's
        // navigation collection would let EF mis-flag the client-keyed child as Modified.
        _context.ApprovalDecisions.Add(new ApprovalDecision
        {
            Id = Guid.NewGuid(),
            AgentWorkflowId = workflow.Id,
            Action = command.Action,
            DecidedBy = command.DecidedBy,
            Reason = command.Reason,
            RevisionsJson = command.Revisions is null ? null : JsonSerializer.Serialize(command.Revisions),
            DecidedAt = DateTime.UtcNow
        });
    }

    private static WorkflowStatus MapStatus(string? agentStatus) => agentStatus switch
    {
        "COMPLETED" or "EXECUTING" => WorkflowStatus.Completed,
        "APPROVED" => WorkflowStatus.Approved,
        "REJECTED" => WorkflowStatus.Rejected,
        "FAILED" => WorkflowStatus.Failed,
        _ => WorkflowStatus.Failed
    };
}
