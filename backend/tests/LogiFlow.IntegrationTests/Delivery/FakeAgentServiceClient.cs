using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LogiFlow.Application.Workflows;
using LogiFlow.Application.Workflows.DTOs;

namespace LogiFlow.IntegrationTests.Delivery;

/// <summary>Deterministic stand-in for the Python agent during integration tests.</summary>
public sealed class FakeAgentServiceClient : IAgentServiceClient
{
    public Task<AgentRunResponse> RunAsync(AgentRunPayload payload, CancellationToken cancellationToken = default)
    {
        var sequenced = payload.Stops
            .Select((stop, index) => new AgentSequencedStop(
                index + 1, stop.StopId, $"2026-09-22T09:{(index * 20):D2}:00", index == 0 ? 0.0 : 2.5))
            .ToList();

        var routing = new AgentRoutingOutput(
            payload.WorkflowId, sequenced,
            sequenced.Sum(s => s.DistanceFromPrevKm), 20,
            new[] { new AgentNotification("ON_THE_WAY", "PUSH", "on the way") });

        var audit = new[]
        {
            new AgentAuditEntry("route", "routing", "Route planned.", new[] { "route_sequencer" }, 100, true)
        };

        return Task.FromResult(new AgentRunResponse(
            payload.WorkflowId, "AWAITING_APPROVAL", new AgentProposal(routing), audit, Array.Empty<AgentError>()));
    }

    public Task<AgentApprovalResponse> ApproveAsync(
        string workflowKey, AgentApprovalRequest request, CancellationToken cancellationToken = default)
    {
        var status = request.Action == "APPROVE" ? "COMPLETED" : "REJECTED";
        return Task.FromResult(new AgentApprovalResponse(workflowKey, status, "outcome", null));
    }

    public Task<DriverMessageResponse> GenerateDriverMessageAsync(
        DriverMessageRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new DriverMessageResponse("On my way with your order!"));
}
