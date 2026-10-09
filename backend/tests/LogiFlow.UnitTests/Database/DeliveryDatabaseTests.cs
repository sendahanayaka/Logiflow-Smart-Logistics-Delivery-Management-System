using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LogiFlow.UnitTests.Database;

/// <summary>
/// [S4] Database tests for the Delivery slice, run against a real relational engine
/// (SQLite in-memory). Unlike the EF Core in-memory provider, SQLite enforces
/// foreign keys, unique indexes, NOT NULL and transactions, so these exercise the
/// actual schema produced from the model (constraints, relationships, cascades,
/// transactions) plus migration/schema integrity — no Docker/PostgreSQL required.
/// </summary>
public sealed class DeliveryDatabaseTests
{
    // One open connection keeps the in-memory database alive and has FK enforcement on.
    private static (SqliteConnection conn, DbContextOptions<AppDbContext> options) NewDatabase()
    {
        var conn = new SqliteConnection("Filename=:memory:");
        conn.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(conn).Options;
        using var ctx = new AppDbContext(options);
        ctx.Database.EnsureCreated();
        return (conn, options);
    }

    private static AgentWorkflow NewWorkflow(string key) => new()
    {
        Id = Guid.NewGuid(), WorkflowKey = key, DispatchBatchId = Guid.NewGuid(),
        Status = WorkflowStatus.Pending, CreatedAt = DateTime.UtcNow,
    };

    private static RouteStop NewStop(Guid workflowId, int sequence) => new()
    {
        Id = Guid.NewGuid(), AgentWorkflowId = workflowId, StopKey = $"s{sequence}", OrderId = Guid.NewGuid(),
        Sequence = sequence, Address = $"Address {sequence}", Latitude = 6.9, Longitude = 79.8,
        DistanceFromPrevKm = 1m, Eta = DateTime.UtcNow, Status = RouteStopStatus.Pending, CreatedAt = DateTime.UtcNow,
    };

    private static Shipment NewShipment(Guid workflowId, string code) => new()
    {
        Id = Guid.NewGuid(), AgentWorkflowId = workflowId, ShipmentCode = code, DriverId = Guid.NewGuid(),
        VehicleId = Guid.NewGuid(), Status = ShipmentStatus.Created, TotalDistanceKm = 5m, TotalDurationMin = 30m,
        PlannedStartAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow,
    };

    private static TrackingEvent NewTracking(Guid shipmentId) => new()
    {
        Id = Guid.NewGuid(), ShipmentId = shipmentId, EventType = TrackingEventType.Dispatched,
        OccurredAt = DateTime.UtcNow, CreatedAt = DateTime.UtcNow,
    };

    // ---------- Constraint tests ----------

    // DB-CON-01: ShipmentCode has a unique index — a duplicate code is rejected.
    [Fact]
    public async Task ShipmentCode_MustBeUnique()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;
        using var ctx = new AppDbContext(options);
        var w1 = NewWorkflow("WF-U1");
        var w2 = NewWorkflow("WF-U2");
        ctx.AgentWorkflows.AddRange(w1, w2);
        ctx.Shipments.Add(NewShipment(w1.Id, "SHP-DUP"));
        ctx.Shipments.Add(NewShipment(w2.Id, "SHP-DUP")); // same code → violation

        await Assert.ThrowsAsync<DbUpdateException>(() => ctx.SaveChangesAsync());
    }

    // DB-CON-02: (AgentWorkflowId, Sequence) is unique — two stops can't share a sequence.
    [Fact]
    public async Task RouteStop_SequenceMustBeUniqueWithinWorkflow()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;
        using var ctx = new AppDbContext(options);
        var w = NewWorkflow("WF-RS");
        ctx.AgentWorkflows.Add(w);
        ctx.RouteStops.Add(NewStop(w.Id, 1));
        ctx.RouteStops.Add(NewStop(w.Id, 1)); // duplicate sequence in the same workflow

        await Assert.ThrowsAsync<DbUpdateException>(() => ctx.SaveChangesAsync());
    }

    // DB-CON-03: WorkflowKey has a unique index.
    [Fact]
    public async Task WorkflowKey_MustBeUnique()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;
        using var ctx = new AppDbContext(options);
        ctx.AgentWorkflows.Add(NewWorkflow("DUP-KEY"));
        ctx.AgentWorkflows.Add(NewWorkflow("DUP-KEY"));

        await Assert.ThrowsAsync<DbUpdateException>(() => ctx.SaveChangesAsync());
    }

    // DB-CON-04: a TrackingEvent referencing a non-existent shipment violates the FK.
    [Fact]
    public async Task TrackingEvent_WithUnknownShipment_ViolatesForeignKey()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;
        using var ctx = new AppDbContext(options);
        ctx.TrackingEvents.Add(NewTracking(Guid.NewGuid())); // no such shipment

        await Assert.ThrowsAsync<DbUpdateException>(() => ctx.SaveChangesAsync());
    }

    // ---------- Relationship / data-integrity tests ----------

    // DB-REL-01: deleting a workflow cascades to its stops, its shipment, and (via the
    // shipment) its tracking events — the whole S4 graph is cleaned up.
    [Fact]
    public async Task DeletingWorkflow_CascadesToStopsShipmentAndTracking()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;

        var w = NewWorkflow("WF-CAS");
        var shipment = NewShipment(w.Id, "SHP-CAS");
        await using (var seed = new AppDbContext(options))
        {
            seed.AgentWorkflows.Add(w);
            seed.RouteStops.AddRange(NewStop(w.Id, 1), NewStop(w.Id, 2));
            seed.Shipments.Add(shipment);
            await seed.SaveChangesAsync();
            seed.TrackingEvents.Add(NewTracking(shipment.Id));
            await seed.SaveChangesAsync();
        }

        // Delete only the workflow (children untracked) → DB cascades the rest.
        await using (var act = new AppDbContext(options))
        {
            var workflow = await act.AgentWorkflows.SingleAsync(x => x.Id == w.Id);
            act.AgentWorkflows.Remove(workflow);
            await act.SaveChangesAsync();
        }

        await using var verify = new AppDbContext(options);
        Assert.Equal(0, await verify.AgentWorkflows.CountAsync());
        Assert.Equal(0, await verify.RouteStops.CountAsync());
        Assert.Equal(0, await verify.Shipments.CountAsync());
        Assert.Equal(0, await verify.TrackingEvents.CountAsync());
    }

    // DB-REL-02: the shipment → workflow → stops and shipment → tracking relationships
    // load correctly through navigation properties.
    [Fact]
    public async Task ShipmentGraph_LoadsRelatedEntities()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;

        var w = NewWorkflow("WF-REL");
        var shipment = NewShipment(w.Id, "SHP-REL");
        await using (var seed = new AppDbContext(options))
        {
            seed.AgentWorkflows.Add(w);
            seed.RouteStops.AddRange(NewStop(w.Id, 1), NewStop(w.Id, 2));
            seed.Shipments.Add(shipment);
            await seed.SaveChangesAsync();
            seed.TrackingEvents.Add(NewTracking(shipment.Id));
            await seed.SaveChangesAsync();
        }

        await using var verify = new AppDbContext(options);
        var loaded = await verify.Shipments
            .Include(s => s.AgentWorkflow).ThenInclude(wf => wf.RouteStops)
            .Include(s => s.TrackingEvents)
            .SingleAsync(s => s.ShipmentCode == "SHP-REL");

        Assert.NotNull(loaded.AgentWorkflow);
        Assert.Equal("WF-REL", loaded.AgentWorkflow.WorkflowKey);
        Assert.Equal(2, loaded.AgentWorkflow.RouteStops.Count);
        Assert.Single(loaded.TrackingEvents);
    }

    // ---------- Transaction tests ----------

    // DB-TXN-01: a rolled-back transaction persists nothing.
    [Fact]
    public async Task Transaction_Rollback_PersistsNothing()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;

        await using (var ctx = new AppDbContext(options))
        {
            await using var tx = await ctx.Database.BeginTransactionAsync();
            var w = NewWorkflow("WF-TX-RB");
            ctx.AgentWorkflows.Add(w);
            ctx.Shipments.Add(NewShipment(w.Id, "SHP-TX-RB"));
            await ctx.SaveChangesAsync();
            await tx.RollbackAsync();
        }

        await using var verify = new AppDbContext(options);
        Assert.Equal(0, await verify.Shipments.CountAsync());
        Assert.Equal(0, await verify.AgentWorkflows.CountAsync());
    }

    // DB-TXN-02: a committed transaction persists the rows.
    [Fact]
    public async Task Transaction_Commit_PersistsRows()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;

        await using (var ctx = new AppDbContext(options))
        {
            await using var tx = await ctx.Database.BeginTransactionAsync();
            var w = NewWorkflow("WF-TX-OK");
            ctx.AgentWorkflows.Add(w);
            ctx.Shipments.Add(NewShipment(w.Id, "SHP-TX-OK"));
            await ctx.SaveChangesAsync();
            await tx.CommitAsync();
        }

        await using var verify = new AppDbContext(options);
        Assert.Equal(1, await verify.Shipments.CountAsync());
    }

    // ---------- Schema / migration integrity ----------

    // DB-MIG-01: the model creates all S4 tables in a real relational schema.
    [Fact]
    public void Schema_ContainsAllS4Tables()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;
        using var ctx = new AppDbContext(options);

        var expected = new[] { typeof(Shipment), typeof(AgentWorkflow), typeof(RouteStop), typeof(TrackingEvent), typeof(Notification), typeof(Message) }
            .Select(t => ctx.Model.FindEntityType(t)!.GetTableName()!)
            .ToArray();

        var actual = new List<string>();
        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table';";
            using var reader = cmd.ExecuteReader();
            while (reader.Read()) actual.Add(reader.GetString(0));
        }

        Assert.All(expected, table => Assert.Contains(table, actual));
    }

    // DB-MIG-02: the S4 migrations are present/tracked in the migrations assembly.
    [Fact]
    public void Migrations_IncludeS4Migrations()
    {
        var (conn, options) = NewDatabase();
        using var _ = conn;
        using var ctx = new AppDbContext(options);

        var migrations = ctx.Database.GetMigrations().ToList();

        Assert.Contains(migrations, m => m.Contains("AddAgentWorkflowAllocation"));
        Assert.Contains(migrations, m => m.Contains("AddNotifications"));
        Assert.Contains(migrations, m => m.Contains("AddMessages"));
    }
}
