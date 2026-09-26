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
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<DeliveryOrder> DeliveryOrders { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(
        IsolationLevel isolationLevel,
        CancellationToken cancellationToken = default);
}
