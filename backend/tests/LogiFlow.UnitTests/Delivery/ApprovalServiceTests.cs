using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LogiFlow.Application.Workflows;
using LogiFlow.Application.Workflows.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LogiFlow.UnitTests.Delivery;

public sealed class ApprovalServiceTests : IAsyncLifetime
{
    private DbContextOptions<AppDbContext> _options = null!;
    private AppDbContext _context = null!;
    private FakeAgentServiceClient _agent = null!;
    private ApprovalService _service = null!;

    public async Task InitializeAsync()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"approval-tests-{Guid.NewGuid():N}")
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();
        _agent = new FakeAgentServiceClient();
        _service = new ApprovalService(_context, _agent, NullLogger<ApprovalService>.Instance);
    }

    public async Task DisposeAsync() => await _context.DisposeAsync();

    // --- APPROVE --------------------------------------------------------------

    [Fact]
    public async Task Approve_DispatchesShipment_WithTrackingEvent_AndCompletes()
    {
        var workflow = await SeedAwaitingWorkflowAsync();

        var result = await _service.DecideAsync(workflow.Id, ApproveCommand());

        Assert.Equal(nameof(WorkflowStatus.Completed), result.Status);
        Assert.NotNull(result.ShipmentId);
        Assert.Equal("APPROVE", _agent.LastApproval!.Action); // the agent was resumed

        var shipment = await _context.Shipments.Include(s => s.TrackingEvents).SingleAsync();
        Assert.Equal(ShipmentStatus.Dispatched, shipment.Status);
        Assert.Equal(2.5m, shipment.TotalDistanceKm);          // 0 + 2.5
        Assert.NotNull(shipment.DispatchedAt);
        var evt = Assert.Single(shipment.TrackingEvents);
        Assert.Equal(TrackingEventType.Dispatched, evt.EventType);

        var stored = await _context.AgentWorkflows.Include(w => w.ApprovalDecisions)
            .SingleAsync(w => w.Id == workflow.Id);
        Assert.Equal(WorkflowStatus.Completed, stored.Status);
        Assert.Equal(ApprovalAction.Approve, Assert.Single(stored.ApprovalDecisions).Action);
    }

    [Fact]
    public async Task Approve_WithoutDriverOrVehicle_Throws()
    {
        var workflow = await SeedAwaitingWorkflowAsync();

        var command = new ApproveWorkflowCommand(
            ApprovalAction.Approve, "ops-manager", null, null, DriverId: null, VehicleId: null);

        await Assert.ThrowsAsync<ArgumentException>(() => _service.DecideAsync(workflow.Id, command));
        Assert.False(await _context.Shipments.AnyAsync());
    }

    // --- REJECT ---------------------------------------------------------------

    [Fact]
    public async Task Reject_MarksRejected_NoShipment()
    {
        var workflow = await SeedAwaitingWorkflowAsync();

        var result = await _service.DecideAsync(workflow.Id,
            new ApproveWorkflowCommand(ApprovalAction.Reject, "ops-manager", "too late", null, null, null));

        Assert.Equal(nameof(WorkflowStatus.Rejected), result.Status);
        Assert.Null(result.ShipmentId);
        Assert.Equal("REJECT", _agent.LastApproval!.Action);
        Assert.False(await _context.Shipments.AnyAsync());
    }

    // --- REVISE ---------------------------------------------------------------

    [Fact]
    public async Task Revise_KeepsAwaiting_NoShipment_NoAgentCall()
    {
        var workflow = await SeedAwaitingWorkflowAsync();

        var result = await _service.DecideAsync(workflow.Id,
            new ApproveWorkflowCommand(ApprovalAction.Revise, "ops-manager", "swap the fragile stop",
                new Dictionary<string, object> { ["resequence"] = true }, null, null));

        Assert.Equal(nameof(WorkflowStatus.AwaitingApproval), result.Status);
        Assert.Null(result.ShipmentId);
        Assert.Null(_agent.LastApproval);                       // agent NOT resumed on revise
        Assert.False(await _context.Shipments.AnyAsync());

        var stored = await _context.AgentWorkflows.Include(w => w.ApprovalDecisions)
            .SingleAsync(w => w.Id == workflow.Id);
        Assert.Equal(WorkflowStatus.AwaitingApproval, stored.Status);
        Assert.Equal(ApprovalAction.Revise, Assert.Single(stored.ApprovalDecisions).Action);
    }

    // --- guards ---------------------------------------------------------------

    [Fact]
    public async Task Decide_WhenAlreadyDecided_Throws()
    {
        var workflow = await SeedAwaitingWorkflowAsync();
        await _service.DecideAsync(workflow.Id, ApproveCommand()); // now Completed

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.DecideAsync(workflow.Id, ApproveCommand()));   // second decision blocked
    }

    [Fact]
    public async Task Decide_UnknownWorkflow_Throws()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.DecideAsync(Guid.NewGuid(), ApproveCommand()));
    }

    // --- helpers --------------------------------------------------------------

    private static ApproveWorkflowCommand ApproveCommand() =>
        new(ApprovalAction.Approve, "ops-manager", null, null, Guid.NewGuid(), Guid.NewGuid());

    private async Task<AgentWorkflow> SeedAwaitingWorkflowAsync()
    {
        var workflow = new AgentWorkflow
        {
            Id = Guid.NewGuid(),
            WorkflowKey = $"wf-{Guid.NewGuid():N}"[..15],
            DispatchBatchId = Guid.NewGuid(),
            Status = WorkflowStatus.AwaitingApproval,
            CreatedAt = DateTime.UtcNow
        };
        workflow.RouteStops.Add(new RouteStop
        {
            Id = Guid.NewGuid(), StopKey = "s1", OrderId = Guid.NewGuid(), Sequence = 1,
            Address = "Kandy 1", Latitude = 7.2906, Longitude = 80.6337, DistanceFromPrevKm = 0m,
            Eta = new DateTime(2026, 9, 22, 9, 0, 0, DateTimeKind.Utc),
            Status = RouteStopStatus.Pending, CreatedAt = DateTime.UtcNow
        });
        workflow.RouteStops.Add(new RouteStop
        {
            Id = Guid.NewGuid(), StopKey = "s2", OrderId = Guid.NewGuid(), Sequence = 2,
            Address = "Kandy 2", Latitude = 7.2950, Longitude = 80.6350, DistanceFromPrevKm = 2.5m,
            Eta = new DateTime(2026, 9, 22, 9, 20, 0, DateTimeKind.Utc),
            Status = RouteStopStatus.Pending, CreatedAt = DateTime.UtcNow
        });
        // Seed through a separate context (same in-memory DB) so the service's context
        // starts clean and loads from the store, as a real request would.
        await using var seedContext = new AppDbContext(_options);
        seedContext.AgentWorkflows.Add(workflow);
        await seedContext.SaveChangesAsync();
        return workflow;
    }

    private sealed class FakeAgentServiceClient : IAgentServiceClient
    {
        public AgentApprovalRequest? LastApproval { get; private set; }

        public Task<AgentRunResponse> RunAsync(AgentRunPayload payload, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<AgentApprovalResponse> ApproveAsync(
            string workflowKey, AgentApprovalRequest request, CancellationToken cancellationToken = default)
        {
            LastApproval = request;
            var status = request.Action == "APPROVE" ? "COMPLETED" : "REJECTED";
            return Task.FromResult(new AgentApprovalResponse(workflowKey, status, "outcome", null));
        }
    }
}
