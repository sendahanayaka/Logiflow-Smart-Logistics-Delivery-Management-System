using System.Data;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Warehouse.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LogiFlow.Application.Warehouse;

public sealed class DispatchBatchService : IDispatchBatchService
{
    private readonly IAppDbContext _context;

    public DispatchBatchService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DispatchBatchResponse> CreateBatchAsync(
        CreateDispatchBatchCommand command,
        CancellationToken cancellationToken = default)
    {
        ValidateCreateCommand(command);

        await using var transaction = await _context.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var batch = await BuildReservedBatchAsync(command, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return MapBatch(batch);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<DispatchBatchResponse> ReplaceItemsAsync(
        Guid batchId,
        ReplaceDispatchBatchItemsCommand command,
        CancellationToken cancellationToken = default)
    {
        if (batchId == Guid.Empty)
        {
            throw new ArgumentException("Dispatch batch ID is required.", nameof(batchId));
        }

        ValidatePackageIds(command.PackageIds);

        await using var transaction = await _context.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var batch = await _context.DispatchBatches
                .Include(item => item.Items)
                    .ThenInclude(item => item.Package)
                        .ThenInclude(package => package.StorageZone)
                .FirstOrDefaultAsync(item => item.Id == batchId, cancellationToken);

            if (batch is null)
            {
                throw new KeyNotFoundException($"Dispatch batch '{batchId}' was not found.");
            }

            if (batch.Status != DispatchBatchStatus.Reserved)
            {
                throw new InvalidOperationException("Only reserved dispatch batches may have their items replaced.");
            }

            var previousPackageIds = batch.Items
                .Select(item => item.PackageId)
                .ToHashSet();

            var packages = await LoadPackagesAsync(command.PackageIds, cancellationToken);
            ValidatePackagesForBatch(
                packages,
                command.PackageIds,
                batch.WarehouseId,
                batch.MaxWeightKg,
                batch.MaxVolumeM3,
                previousPackageIds);

            var existingItems = batch.Items.ToList();

            foreach (var item in existingItems)
            {
                if (!command.PackageIds.Contains(item.PackageId))
                {
                    item.Package.Status = PackageStatus.Available;
                }
            }

            _context.DispatchBatchItems.RemoveRange(existingItems);
            batch.Items.Clear();
            AddReservedItems(batch, packages);
            batch.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return MapBatch(batch);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<DispatchBatchValidationResponse> GetValidationAsync(
        Guid batchId,
        CancellationToken cancellationToken = default)
    {
        if (batchId == Guid.Empty)
        {
            throw new ArgumentException("Dispatch batch ID is required.", nameof(batchId));
        }

        var batch = await _context.DispatchBatches
            .AsNoTracking()
            .Include(item => item.Items)
                .ThenInclude(item => item.Package)
            .FirstOrDefaultAsync(item => item.Id == batchId, cancellationToken);

        if (batch is null)
        {
            throw new KeyNotFoundException($"Dispatch batch '{batchId}' was not found.");
        }

        var totalWeightKg = batch.Items.Sum(item => item.Package.WeightKg);
        var totalVolumeM3 = batch.Items.Sum(item => item.Package.VolumeM3);
        var capacityValid = totalWeightKg <= batch.MaxWeightKg &&
                            totalVolumeM3 <= batch.MaxVolumeM3;
        var packageAvailabilityValid = batch.Items.All(
            item => item.Package.Status == PackageStatus.Reserved);
        var warehouseConsistent = batch.Items.All(
            item => item.Package.WarehouseId == batch.WarehouseId);
        var fragileLoadOrderValid = HasFragileLoadOrder(batch.Items);
        var issues = new List<string>();

        if (batch.Items.Count == 0)
        {
            issues.Add("A dispatch batch must contain at least one package.");
        }

        if (!capacityValid)
        {
            issues.Add("Batch totals exceed the stored vehicle capacity context.");
        }

        if (!packageAvailabilityValid)
        {
            issues.Add("All batch packages must remain reserved.");
        }

        if (!warehouseConsistent)
        {
            issues.Add("All batch packages must belong to the batch warehouse.");
        }

        if (!fragileLoadOrderValid)
        {
            issues.Add("Fragile packages must be assigned after non-fragile packages.");
        }

        return new DispatchBatchValidationResponse(
            batch.Id,
            batch.WarehouseId,
            batch.Items.Count,
            totalWeightKg,
            totalVolumeM3,
            capacityValid,
            packageAvailabilityValid,
            warehouseConsistent,
            fragileLoadOrderValid,
            issues.Count == 0 ? "PASS" : "FAIL",
            issues);
    }

    public async Task<WarehouseThroughputResponse> GetThroughputAsync(
        Guid warehouseId,
        WarehouseThroughputQuery query,
        CancellationToken cancellationToken = default)
    {
        if (warehouseId == Guid.Empty)
        {
            throw new ArgumentException("Warehouse ID is required.", nameof(warehouseId));
        }

        if (query.FromUtc > query.ToUtc)
        {
            throw new ArgumentException("The throughput start must not be after the end.");
        }

        var warehouseExists = await _context.Warehouses
            .AnyAsync(warehouse => warehouse.Id == warehouseId, cancellationToken);

        if (!warehouseExists)
        {
            throw new KeyNotFoundException($"Warehouse '{warehouseId}' was not found.");
        }

        var packages = _context.Packages
            .AsNoTracking()
            .Where(package => package.WarehouseId == warehouseId &&
                              package.ReceivedAt >= query.FromUtc &&
                              package.ReceivedAt <= query.ToUtc);

        var receivedPackageCount = await packages.CountAsync(cancellationToken);
        var receivedWeightKg = await packages
            .Select(package => (decimal?)package.WeightKg)
            .SumAsync(cancellationToken) ?? 0;
        var receivedVolumeM3 = await packages
            .Select(package => (decimal?)package.VolumeM3)
            .SumAsync(cancellationToken) ?? 0;
        var reservedPackageCount = await packages
            .CountAsync(package => package.Status == PackageStatus.Reserved, cancellationToken);
        var dispatchedPackageCount = await packages
            .CountAsync(package => package.Status == PackageStatus.Dispatched, cancellationToken);

        return new WarehouseThroughputResponse(
            warehouseId,
            query.FromUtc,
            query.ToUtc,
            receivedPackageCount,
            receivedWeightKg,
            receivedVolumeM3,
            reservedPackageCount,
            dispatchedPackageCount);
    }

    private async Task<DispatchBatch> BuildReservedBatchAsync(
        CreateDispatchBatchCommand command,
        CancellationToken cancellationToken)
    {
        var warehouseExists = await _context.Warehouses
            .AnyAsync(warehouse => warehouse.Id == command.WarehouseId, cancellationToken);

        if (!warehouseExists)
        {
            throw new KeyNotFoundException($"Warehouse '{command.WarehouseId}' was not found.");
        }

        var packages = await LoadPackagesAsync(command.PackageIds, cancellationToken);
        ValidatePackagesForBatch(
            packages,
            command.PackageIds,
            command.WarehouseId,
            command.VehicleCapacity.MaxWeightKg,
            command.VehicleCapacity.MaxVolumeM3,
            new HashSet<Guid>());

        var batch = new DispatchBatch
        {
            Id = Guid.NewGuid(),
            WarehouseId = command.WarehouseId,
            VehicleId = command.VehicleCapacity.VehicleId.Trim(),
            MaxWeightKg = command.VehicleCapacity.MaxWeightKg,
            MaxVolumeM3 = command.VehicleCapacity.MaxVolumeM3,
            Status = DispatchBatchStatus.Reserved,
            CreatedAt = DateTime.UtcNow
        };

        AddReservedItems(batch, packages);
        _context.DispatchBatches.Add(batch);

        return batch;
    }

    private async Task<List<Package>> LoadPackagesAsync(
        IReadOnlyCollection<Guid> packageIds,
        CancellationToken cancellationToken) =>
        await _context.Packages
            .Include(package => package.StorageZone)
            .Where(package => packageIds.Contains(package.Id))
            .ToListAsync(cancellationToken);

    private static void ValidateCreateCommand(CreateDispatchBatchCommand command)
    {
        if (command.WarehouseId == Guid.Empty)
        {
            throw new ArgumentException("Warehouse ID is required.", nameof(command.WarehouseId));
        }

        if (string.IsNullOrWhiteSpace(command.VehicleCapacity.VehicleId))
        {
            throw new ArgumentException("Vehicle ID is required.", nameof(command.VehicleCapacity.VehicleId));
        }

        if (command.VehicleCapacity.MaxWeightKg <= 0)
        {
            throw new ArgumentException(
                "Vehicle maximum weight must be greater than zero.",
                nameof(command.VehicleCapacity.MaxWeightKg));
        }

        if (command.VehicleCapacity.MaxVolumeM3 <= 0)
        {
            throw new ArgumentException(
                "Vehicle maximum volume must be greater than zero.",
                nameof(command.VehicleCapacity.MaxVolumeM3));
        }

        ValidatePackageIds(command.PackageIds);
    }

    private static void ValidatePackageIds(IReadOnlyCollection<Guid> packageIds)
    {
        if (packageIds.Count == 0)
        {
            throw new ArgumentException("At least one package ID is required.", nameof(packageIds));
        }

        if (packageIds.Any(packageId => packageId == Guid.Empty))
        {
            throw new ArgumentException("Package IDs must not be empty.", nameof(packageIds));
        }

        if (packageIds.Distinct().Count() != packageIds.Count)
        {
            throw new ArgumentException("Package IDs must be unique.", nameof(packageIds));
        }
    }

    private static void ValidatePackagesForBatch(
        IReadOnlyCollection<Package> packages,
        IReadOnlyCollection<Guid> requestedPackageIds,
        Guid warehouseId,
        decimal maxWeightKg,
        decimal maxVolumeM3,
        IReadOnlySet<Guid> currentlyReservedByBatch)
    {
        if (packages.Count != requestedPackageIds.Count)
        {
            throw new KeyNotFoundException("One or more requested packages were not found.");
        }

        if (packages.Any(package => package.WarehouseId != warehouseId))
        {
            throw new ArgumentException("All requested packages must belong to the batch warehouse.");
        }

        if (packages.Any(
                package => package.Status != PackageStatus.Available &&
                           !(currentlyReservedByBatch.Contains(package.Id) &&
                             package.Status == PackageStatus.Reserved)))
        {
            throw new InvalidOperationException("Only available packages may be added to a dispatch batch.");
        }

        if (packages.Sum(package => package.WeightKg) > maxWeightKg)
        {
            throw new InvalidOperationException("The requested packages exceed vehicle weight capacity.");
        }

        if (packages.Sum(package => package.VolumeM3) > maxVolumeM3)
        {
            throw new InvalidOperationException("The requested packages exceed vehicle volume capacity.");
        }
    }

    private void AddReservedItems(DispatchBatch batch, IReadOnlyCollection<Package> packages)
    {
        var orderedPackages = packages
            .OrderBy(package => package.StorageZone.Code)
            .ThenBy(package => package.IsFragile)
            .ThenByDescending(package => package.WeightKg)
            .ThenBy(package => package.Id)
            .ToList();

        for (var index = 0; index < orderedPackages.Count; index++)
        {
            var package = orderedPackages[index];
            package.Status = PackageStatus.Reserved;

            batch.Items.Add(new DispatchBatchItem
            {
                Id = Guid.NewGuid(),
                DispatchBatchId = batch.Id,
                PackageId = package.Id,
                Package = package,
                LoadSequence = index + 1
            });
        }
    }

    private static bool HasFragileLoadOrder(IEnumerable<DispatchBatchItem> items)
    {
        var materializedItems = items.ToList();
        var latestNonFragile = materializedItems
            .Where(item => !item.Package.IsFragile)
            .Select(item => item.LoadSequence)
            .DefaultIfEmpty(0)
            .Max();
        var earliestFragile = materializedItems
            .Where(item => item.Package.IsFragile)
            .Select(item => item.LoadSequence)
            .DefaultIfEmpty(int.MaxValue)
            .Min();

        return latestNonFragile < earliestFragile;
    }

    private static DispatchBatchResponse MapBatch(DispatchBatch batch)
    {
        var items = batch.Items
            .OrderBy(item => item.LoadSequence)
            .Select(item => new DispatchBatchItemResponse(
                item.PackageId,
                item.Package.TrackingCode,
                item.LoadSequence,
                item.Package.WeightKg,
                item.Package.VolumeM3,
                item.Package.IsFragile))
            .ToList();

        return new DispatchBatchResponse(
            batch.Id,
            batch.WarehouseId,
            batch.VehicleId,
            batch.MaxWeightKg,
            batch.MaxVolumeM3,
            items.Sum(item => item.WeightKg),
            items.Sum(item => item.VolumeM3),
            batch.Status.ToString(),
            items,
            batch.CreatedAt,
            batch.UpdatedAt);
    }
}
