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
    private readonly BatchingEngine _batchingEngine;

    public DispatchBatchService(IAppDbContext context, BatchingEngine batchingEngine)
    {
        _context = context;
        _batchingEngine = batchingEngine;
    }

    public async Task<DispatchBatchCreationResponse> CreateBatchAsync(
        CreateDispatchBatchCommand command,
        CancellationToken cancellationToken = default)
    {
        ValidateCreateCommand(command);

        await using var transaction = await _context.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var packages = new List<Package>();
        var affectedPackages = new List<Package>();
        var originalStatuses = new Dictionary<Guid, PackageStatus>();

        try
        {
            var warehouseExists = await _context.Warehouses
                .AnyAsync(warehouse => warehouse.Id == command.WarehouseId, cancellationToken);

            if (!warehouseExists)
            {
                throw new KeyNotFoundException($"Warehouse '{command.WarehouseId}' was not found.");
            }

            packages = await LoadPackagesAsync(command.PackageIds, cancellationToken);
            EnsureAllPackagesWereLoaded(packages, command.PackageIds);

            var plan = _batchingEngine.Plan(
                command.WarehouseId,
                command.VehicleCapacity,
                CreateCandidates(packages));

            if (!plan.IsPass)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Revise(plan);
            }

            affectedPackages = packages;
            originalStatuses = affectedPackages.ToDictionary(
                package => package.Id,
                package => package.Status);
            var batch = CreateReservedBatch(command, packages, plan);

            _context.DispatchBatches.Add(batch);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Pass(batch);
        }
        catch
        {
            RestoreStatuses(affectedPackages, originalStatuses);
            await transaction.RollbackAsync(cancellationToken);
            _context.ClearChangeTracker();
            throw;
        }
    }

    public async Task<DispatchBatchCreationResponse> ReplaceItemsAsync(
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

        var packages = new List<Package>();
        var affectedPackages = new List<Package>();
        var originalStatuses = new Dictionary<Guid, PackageStatus>();

        try
        {
            var batch = await _context.DispatchBatches
                .Include(item => item.Items)
                    .ThenInclude(item => item.Package)
                .FirstOrDefaultAsync(item => item.Id == batchId, cancellationToken);

            if (batch is null)
            {
                throw new KeyNotFoundException($"Dispatch batch '{batchId}' was not found.");
            }

            if (batch.Status != DispatchBatchStatus.Reserved)
            {
                throw new InvalidOperationException("Only reserved dispatch batches may have their items replaced.");
            }

            var existingItems = batch.Items.ToList();
            var existingPackageIds = existingItems
                .Select(item => item.PackageId)
                .ToHashSet();

            packages = await LoadPackagesAsync(command.PackageIds, cancellationToken);
            EnsureAllPackagesWereLoaded(packages, command.PackageIds);

            var plan = _batchingEngine.Plan(
                batch.WarehouseId,
                new VehicleCapacityContext(batch.VehicleId, batch.MaxWeightKg, batch.MaxVolumeM3),
                CreateCandidates(packages, existingPackageIds));

            if (!plan.IsPass)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Revise(plan);
            }

            affectedPackages = existingItems
                .Select(item => item.Package)
                .Concat(packages)
                .GroupBy(package => package.Id)
                .Select(group => group.First())
                .ToList();
            originalStatuses = affectedPackages.ToDictionary(
                package => package.Id,
                package => package.Status);

            foreach (var item in existingItems)
            {
                if (!command.PackageIds.Contains(item.PackageId))
                {
                    item.Package.Status = PackageStatus.Available;
                }
            }

            _context.DispatchBatchItems.RemoveRange(existingItems);
            batch.Items.Clear();
            AddReservedItems(batch, packages, plan);
            batch.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return Pass(batch);
        }
        catch
        {
            RestoreStatuses(affectedPackages, originalStatuses);
            await transaction.RollbackAsync(cancellationToken);
            _context.ClearChangeTracker();
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
        var weightCapacityValid = totalWeightKg <= batch.MaxWeightKg;
        var volumeCapacityValid = totalVolumeM3 <= batch.MaxVolumeM3;
        var packageAvailabilityValid = batch.Items.All(
            item => item.Package.Status == PackageStatus.Reserved);
        var warehouseConsistent = batch.Items.All(
            item => item.Package.WarehouseId == batch.WarehouseId);
        var fragileLoadOrderValid = HasCompatibleFragileLoadOrder(batch.Items);
        var issues = new List<string>();

        if (batch.Items.Count == 0)
        {
            issues.Add("A dispatch batch must contain at least one package.");
        }

        if (!weightCapacityValid)
        {
            issues.Add("Batch total weight exceeds the stored vehicle weight capacity.");
        }

        if (!volumeCapacityValid)
        {
            issues.Add("Batch total volume exceeds the stored vehicle volume capacity.");
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
            issues.Add("Fragile packages must form the final top-safe load segment.");
        }

        return new DispatchBatchValidationResponse(
            batch.Id,
            batch.WarehouseId,
            batch.Items.Count,
            totalWeightKg,
            totalVolumeM3,
            weightCapacityValid,
            volumeCapacityValid,
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

        var batches = _context.DispatchBatches
            .AsNoTracking()
            .Where(batch => batch.WarehouseId == warehouseId &&
                            batch.CreatedAt >= query.FromUtc &&
                            batch.CreatedAt <= query.ToUtc);

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
        var createdDispatchBatchCount = await batches.CountAsync(cancellationToken);
        var batchedPackageCount = await _context.DispatchBatchItems
            .AsNoTracking()
            .CountAsync(
                item => item.DispatchBatch.WarehouseId == warehouseId &&
                        item.DispatchBatch.CreatedAt >= query.FromUtc &&
                        item.DispatchBatch.CreatedAt <= query.ToUtc,
                cancellationToken);

        return new WarehouseThroughputResponse(
            warehouseId,
            query.FromUtc,
            query.ToUtc,
            receivedPackageCount,
            receivedWeightKg,
            receivedVolumeM3,
            reservedPackageCount,
            dispatchedPackageCount,
            createdDispatchBatchCount,
            batchedPackageCount);
    }

    private static DispatchBatch CreateReservedBatch(
        CreateDispatchBatchCommand command,
        IReadOnlyCollection<Package> packages,
        BatchingPlan plan)
    {
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

        AddReservedItems(batch, packages, plan);
        return batch;
    }

    private static void AddReservedItems(
        DispatchBatch batch,
        IReadOnlyCollection<Package> packages,
        BatchingPlan plan)
    {
        var packagesById = packages.ToDictionary(package => package.Id);

        foreach (var plannedItem in plan.Items.OrderBy(item => item.LoadSequence))
        {
            var package = packagesById[plannedItem.PackageId];
            package.Status = PackageStatus.Reserved;

            batch.Items.Add(new DispatchBatchItem
            {
                Id = Guid.NewGuid(),
                DispatchBatchId = batch.Id,
                PackageId = package.Id,
                Package = package,
                LoadSequence = plannedItem.LoadSequence
            });
        }
    }

    private async Task<List<Package>> LoadPackagesAsync(
        IReadOnlyCollection<Guid> packageIds,
        CancellationToken cancellationToken) =>
        await _context.Packages
            .Include(package => package.StorageZone)
            .Where(package => packageIds.Contains(package.Id))
            .ToListAsync(cancellationToken);

    private static IReadOnlyCollection<BatchingCandidate> CreateCandidates(
        IReadOnlyCollection<Package> packages,
        IReadOnlySet<Guid>? alreadyReservedByThisBatch = null) =>
        packages
            .Select(package => new BatchingCandidate(
                package.Id,
                package.WarehouseId,
                package.StorageZone.Code,
                package.TrackingCode,
                package.WeightKg,
                package.VolumeM3,
                package.IsFragile,
                alreadyReservedByThisBatch?.Contains(package.Id) == true
                    ? PackageStatus.Available
                    : package.Status))
            .ToList();

    private static void EnsureAllPackagesWereLoaded(
        IReadOnlyCollection<Package> packages,
        IReadOnlyCollection<Guid> requestedPackageIds)
    {
        if (packages.Count != requestedPackageIds.Count)
        {
            throw new KeyNotFoundException("One or more requested packages were not found.");
        }
    }

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

    private static bool HasCompatibleFragileLoadOrder(
        IEnumerable<DispatchBatchItem> items)
    {
        var orderedItems = items
            .OrderBy(item => item.LoadSequence)
            .ToList();

        if (!orderedItems.Select(item => item.LoadSequence)
                .SequenceEqual(Enumerable.Range(1, orderedItems.Count)))
        {
            return false;
        }

        var firstFragileIndex = orderedItems.FindIndex(item => item.Package.IsFragile);
        return firstFragileIndex < 0 ||
               orderedItems.Skip(firstFragileIndex).All(item => item.Package.IsFragile);
    }

    private static DispatchBatchCreationResponse Pass(DispatchBatch batch) =>
        new("PASS", MapBatch(batch), Array.Empty<string>());

    private static DispatchBatchCreationResponse Revise(BatchingPlan plan) =>
        new("REVISE", null, plan.Issues);

    private static void RestoreStatuses(
        IEnumerable<Package> packages,
        IReadOnlyDictionary<Guid, PackageStatus> originalStatuses)
    {
        foreach (var package in packages)
        {
            if (originalStatuses.TryGetValue(package.Id, out var status))
            {
                package.Status = status;
            }
        }
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
