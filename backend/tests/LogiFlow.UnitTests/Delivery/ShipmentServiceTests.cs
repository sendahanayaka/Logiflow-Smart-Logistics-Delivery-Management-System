using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LogiFlow.Application.Delivery;
using LogiFlow.Application.Delivery.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LogiFlow.UnitTests.Delivery;

public sealed class ShipmentServiceTests : IAsyncLifetime
{
    private DbContextOptions<AppDbContext> _options = null!;
    private AppDbContext _context = null!;
    private ShipmentService _service = null!;

    public async Task InitializeAsync()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"shipment-tests-{Guid.NewGuid():N}")
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();
        _service = new ShipmentService(_context, NullLogger<ShipmentService>.Instance);
    }

    public async Task DisposeAsync() => await _context.DisposeAsync();

    [Fact]
    public async Task GetTracking_ReturnsOrderedTimeline()
    {
        var shipmentId = await SeedShipmentAsync();

        var tracking = await _service.GetTrackingAsync(shipmentId);

        Assert.NotNull(tracking);
        Assert.Equal(2, tracking!.Stops.Count);
        Assert.Equal(new[] { 1, 2 }, tracking.Stops.Select(s => s.Sequence).ToArray());
        Assert.All(tracking.Stops, s => Assert.Null(s.ActualAt)); // nothing happened yet
    }

    [Fact]
    public async Task RecordStopEvent_LateArrival_ShiftsDownstreamEta()
    {
        var shipmentId = await SeedShipmentAsync();

        // Planned: s1 09:00, s2 09:20. Driver reaches s1 at 09:10 (10 min late).
        var tracking = await _service.RecordStopEventAsync(shipmentId,
            new RecordStopEventCommand("s1", "ARRIVED",
                new DateTime(2026, 9, 22, 9, 10, 0, DateTimeKind.Utc), "at door", null, null));

        var s1 = tracking.Stops.Single(s => s.StopKey == "s1");
        var s2 = tracking.Stops.Single(s => s.StopKey == "s2");

        Assert.Equal("Arrived", s1.Status);
        Assert.Equal(new DateTime(2026, 9, 22, 9, 10, 0), s1.ActualAt);         // arrival recorded
        Assert.Equal(new DateTime(2026, 9, 22, 9, 30, 0), s2.PlannedEta);       // shifted +10 min
    }

    [Fact]
    public async Task RecordProof_MarksDelivered_AndCompletesWhenAllDone()
    {
        var shipmentId = await SeedShipmentAsync();

        var afterFirst = await _service.RecordProofOfDeliveryAsync(shipmentId,
            new RecordPodCommand("s1", "Kasun", null, null, null, null));
        Assert.Equal(nameof(ShipmentStatus.InTransit), afterFirst.Status); // one stop left
        Assert.Equal("Delivered", afterFirst.Stops.Single(s => s.StopKey == "s1").Status);

        var afterSecond = await _service.RecordProofOfDeliveryAsync(shipmentId,
            new RecordPodCommand("s2", "Amara", null, null, null, null));
        Assert.Equal(nameof(ShipmentStatus.Delivered), afterSecond.Status);   // all delivered

        var shipment = await _context.Shipments.SingleAsync(s => s.Id == shipmentId);
        Assert.NotNull(shipment.CompletedAt);
    }

    [Fact]
    public async Task RecordProof_Duplicate_Throws()
    {
        var shipmentId = await SeedShipmentAsync();
        await _service.RecordProofOfDeliveryAsync(shipmentId, new RecordPodCommand("s1", "Kasun", null, null, null, null));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.RecordProofOfDeliveryAsync(shipmentId, new RecordPodCommand("s1", "Kasun again", null, null, null, null)));
    }

    [Fact]
    public async Task RecordStopEvent_UnknownShipment_Throws()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.RecordStopEventAsync(Guid.NewGuid(),
                new RecordStopEventCommand("s1", "ARRIVED", null, null, null, null)));
    }

    // --- seed -----------------------------------------------------------------

    private async Task<Guid> SeedShipmentAsync()
    {
        var workflow = new AgentWorkflow
        {
            Id = Guid.NewGuid(),
            WorkflowKey = $"wf-{Guid.NewGuid():N}"[..15],
            DispatchBatchId = Guid.NewGuid(),
            Status = WorkflowStatus.Completed,
            CreatedAt = DateTime.UtcNow
        };
        workflow.RouteStops.Add(NewStop("s1", 1, 0m, new DateTime(2026, 9, 22, 9, 0, 0, DateTimeKind.Utc)));
        workflow.RouteStops.Add(NewStop("s2", 2, 2.5m, new DateTime(2026, 9, 22, 9, 20, 0, DateTimeKind.Utc)));

        var shipment = new Shipment
        {
            Id = Guid.NewGuid(),
            AgentWorkflowId = workflow.Id,
            ShipmentCode = "SHP-TEST-0001",
            DriverId = Guid.NewGuid(),
            VehicleId = Guid.NewGuid(),
            Status = ShipmentStatus.Dispatched,
            TotalDistanceKm = 2.5m,
            TotalDurationMin = 20m,
            PlannedStartAt = new DateTime(2026, 9, 22, 9, 0, 0, DateTimeKind.Utc),
            DispatchedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await using var seed = new AppDbContext(_options);
        seed.AgentWorkflows.Add(workflow);
        seed.Shipments.Add(shipment);
        await seed.SaveChangesAsync();
        return shipment.Id;
    }

    private static RouteStop NewStop(string key, int sequence, decimal distanceKm, DateTime eta) => new()
    {
        Id = Guid.NewGuid(),
        StopKey = key,
        OrderId = Guid.NewGuid(),
        Sequence = sequence,
        Address = $"Kandy {sequence}",
        Latitude = 7.29 + sequence * 0.001,
        Longitude = 80.63,
        DistanceFromPrevKm = distanceKm,
        Eta = eta,
        WindowStart = new DateTime(2026, 9, 22, 9, 0, 0, DateTimeKind.Utc),
        WindowEnd = new DateTime(2026, 9, 22, 17, 0, 0, DateTimeKind.Utc),
        Status = RouteStopStatus.Pending,
        CreatedAt = DateTime.UtcNow
    };
}
