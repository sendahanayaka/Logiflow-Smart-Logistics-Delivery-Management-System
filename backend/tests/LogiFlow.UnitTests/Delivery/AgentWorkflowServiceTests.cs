using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LogiFlow.Application.Workflows;
using LogiFlow.Application.Workflows.DTOs;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace LogiFlow.UnitTests.Delivery;

public sealed class AgentWorkflowServiceTests : IAsyncLifetime
{
    private AppDbContext _context = null!;
    private FakeAgentServiceClient _agent = null!;
    private AgentWorkflowService _service = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"workflow-tests-{Guid.NewGuid():N}")
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new AppDbContext(options);
        await _context.Database.EnsureCreatedAsync();
        _agent = new FakeAgentServiceClient();
        _service = new AgentWorkflowService(_context, _agent);
    }

    public async Task DisposeAsync() => await _context.DisposeAsync();

    // --- happy path -----------------------------------------------------------

    [Fact]
    public async Task RunWorkflowAsync_PersistsWorkflowAtGate_WithOrderedStops()
    {
        var result = await _service.RunWorkflowAsync(TwoStopCommand());

        Assert.Equal(nameof(WorkflowStatus.AwaitingApproval), result.Status);
        Assert.Equal(2, result.StopCount);
        Assert.Equal(new[] { 1, 2 }, result.Stops.Select(stop => stop.Sequence).ToArray());
        Assert.Equal("Two Kandy stops, on time.", result.Summary);

        // actually persisted
        var stored = await _context.AgentWorkflows.Include(w => w.RouteStops)
            .SingleAsync(w => w.Id == result.Id);
        Assert.Equal(WorkflowStatus.AwaitingApproval, stored.Status);
        Assert.Equal(2, stored.RouteStops.Count);
        Assert.NotNull(stored.ProposedPlanJson);
        Assert.NotNull(stored.AuditJson);
    }

    [Fact]
    public async Task RunWorkflowAsync_EnrichesAgentStopsWithRequestData()
    {
        // The agent returns only sequence/stop_id/eta/distance; address+coords come from us.
        var result = await _service.RunWorkflowAsync(TwoStopCommand());

        var first = result.Stops.Single(stop => stop.StopKey == "s1");
        Assert.Equal("Kandy 1", first.Address);
        Assert.Equal(7.2906, first.Latitude);
        Assert.NotEqual(Guid.Empty, first.OrderId);
        Assert.Null(first.OnTime); // authoritative flag is computed later (Phase 3)
    }

    [Fact]
    public async Task RunWorkflowAsync_BuildsPayload_WithKeyDistinctOrdersAndIsoWindows()
    {
        await _service.RunWorkflowAsync(TwoStopCommand());

        var payload = _agent.LastPayload!;
        Assert.StartsWith("wf-", payload.WorkflowId);
        Assert.Equal(2, payload.Stops.Count);
        Assert.Single(payload.OrderIds);                       // both stops share one order id
        Assert.Equal("2026-09-22T09:00:00", payload.DeliveryWindowStart);
        Assert.Equal("2026-09-22T17:00:00", payload.Stops[0].WindowEnd);
    }

    // --- failure handling -----------------------------------------------------

    [Fact]
    public async Task RunWorkflowAsync_AgentSafeFailure_PersistsFailedWithError()
    {
        _agent.OnRun = _ => new AgentRunResponse(
            "wf-x", "FAILED", Proposal: null,
            Audit: Array.Empty<AgentAuditEntry>(),
            Errors: new[] { new AgentError("route", "OSRM exploded", false) });

        var result = await _service.RunWorkflowAsync(TwoStopCommand());

        Assert.Equal(nameof(WorkflowStatus.Failed), result.Status);
        Assert.Empty(result.Stops);
        var stored = await _context.AgentWorkflows.SingleAsync(w => w.Id == result.Id);
        Assert.Contains("OSRM exploded", stored.Error);
    }

    [Fact]
    public async Task RunWorkflowAsync_AgentUnreachable_RecordsFailedRowThenThrows()
    {
        _agent.ThrowOnRun = new AgentServiceException("agent down", statusCode: null);

        await Assert.ThrowsAsync<AgentServiceException>(() => _service.RunWorkflowAsync(TwoStopCommand()));

        // the attempt is not lost
        var failed = await _context.AgentWorkflows.SingleAsync();
        Assert.Equal(WorkflowStatus.Failed, failed.Status);
        Assert.Contains("agent down", failed.Error);
        Assert.Empty(failed.RouteStops);
    }

    [Fact]
    public async Task RunWorkflowAsync_NoStops_ThrowsArgumentException()
    {
        var command = new RunWorkflowCommand(Guid.NewGuid(), "obj", null, null, new List<RunWorkflowStop>());
        await Assert.ThrowsAsync<ArgumentException>(() => _service.RunWorkflowAsync(command));
    }

    // --- read -----------------------------------------------------------------

    [Fact]
    public async Task GetWorkflowAsync_ReturnsPersisted_OrNull()
    {
        var created = await _service.RunWorkflowAsync(TwoStopCommand());

        var found = await _service.GetWorkflowAsync(created.Id);
        Assert.NotNull(found);
        Assert.Equal(2, found!.Stops.Count);

        Assert.Null(await _service.GetWorkflowAsync(Guid.NewGuid()));
    }

    // --- helpers --------------------------------------------------------------

    private static RunWorkflowCommand TwoStopCommand()
    {
        var orderId = Guid.NewGuid();
        return new RunWorkflowCommand(
            DispatchBatchId: Guid.NewGuid(),
            Objective: "Deliver 2 Kandy stops",
            DeliveryWindowStart: new DateTime(2026, 9, 22, 9, 0, 0),
            CustomerNotes: "handle fragile carefully",
            Stops: new List<RunWorkflowStop>
            {
                new("s1", orderId, "Kandy 1", 7.2906, 80.6337,
                    new DateTime(2026, 9, 22, 9, 0, 0), new DateTime(2026, 9, 22, 17, 0, 0)),
                new("s2", orderId, "Kandy 2", 7.2950, 80.6350,
                    new DateTime(2026, 9, 22, 9, 0, 0), new DateTime(2026, 9, 22, 17, 0, 0)),
            });
    }

    private sealed class FakeAgentServiceClient : IAgentServiceClient
    {
        public AgentRunPayload? LastPayload { get; private set; }
        public Func<AgentRunPayload, AgentRunResponse>? OnRun { get; set; }
        public Exception? ThrowOnRun { get; set; }

        public Task<AgentRunResponse> RunAsync(AgentRunPayload payload, CancellationToken cancellationToken = default)
        {
            LastPayload = payload;
            if (ThrowOnRun is not null)
            {
                throw ThrowOnRun;
            }

            return Task.FromResult(OnRun?.Invoke(payload) ?? DefaultResponse(payload));
        }

        public Task<AgentApprovalResponse> ApproveAsync(
            string workflowKey, AgentApprovalRequest request, CancellationToken cancellationToken = default) =>
            Task.FromResult(new AgentApprovalResponse(workflowKey, "COMPLETED", "dispatched", null));

        // Mimics the real agent: echoes the stops in order with deterministic ETAs.
        private static AgentRunResponse DefaultResponse(AgentRunPayload payload)
        {
            var sequenced = payload.Stops
                .Select((stop, index) => new AgentSequencedStop(
                    index + 1,
                    stop.StopId,
                    $"2026-09-22T09:{(index * 20):D2}:00",
                    index == 0 ? 0.0 : 2.5))
                .ToList();

            var routing = new AgentRoutingOutput(
                payload.WorkflowId, sequenced,
                TotalDistanceKm: sequenced.Sum(s => s.DistanceFromPrevKm),
                TotalDurationMin: 20,
                NotificationPlan: new[] { new AgentNotification("ON_THE_WAY", "PUSH", "on the way") });

            var audit = new[]
            {
                new AgentAuditEntry("route", "routing", "Two Kandy stops, on time.",
                    new[] { "route_sequencer", "eta_calculator" }, 120, true)
            };

            return new AgentRunResponse(payload.WorkflowId, "AWAITING_APPROVAL",
                new AgentProposal(routing), audit, Array.Empty<AgentError>());
        }
    }
}
