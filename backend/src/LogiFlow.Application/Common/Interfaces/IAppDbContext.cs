using System.Data;
using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using WarehouseEntity = LogiFlow.Domain.Entities.Warehouse;

namespace LogiFlow.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<WarehouseEntity> Warehouses { get; }
    DbSet<StorageZone> StorageZones { get; }
    DbSet<Package> Packages { get; }

    // [S1] Identity
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }

    // [S4] Delivery execution & tracking
    DbSet<AgentWorkflow> AgentWorkflows { get; }
    DbSet<RouteStop> RouteStops { get; }
    DbSet<Shipment> Shipments { get; }
    DbSet<ApprovalDecision> ApprovalDecisions { get; }
    DbSet<TrackingEvent> TrackingEvents { get; }
    DbSet<ProofOfDelivery> ProofOfDeliveries { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel,
        CancellationToken cancellationToken = default);
}
