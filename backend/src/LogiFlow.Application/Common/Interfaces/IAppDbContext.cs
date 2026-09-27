using System.Data;
using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using WarehouseEntity = LogiFlow.Domain.Entities.Warehouse;

namespace LogiFlow.Application.Common.Interfaces;

public interface IAppDbContext
{
    // Fleet Management
    DbSet<Driver> Drivers { get; }
    DbSet<Vehicle> Vehicles { get; }
    DbSet<AssignmentHistory> AssignmentHistories { get; }
    DbSet<DutySchedule> DutySchedules { get; }
    DbSet<MaintenanceRecord> MaintenanceRecords { get; }

    // Warehouse & User Management
    DbSet<WarehouseEntity> Warehouses { get; }
    DbSet<StorageZone> StorageZones { get; }
    DbSet<Package> Packages { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }

    Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default);

    // Transaction support
    Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel,
        CancellationToken cancellationToken = default);
}