using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Warehouse.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Storage;
using WarehouseEntity = LogiFlow.Domain.Entities.Warehouse;
using Xunit;

namespace LogiFlow.UnitTests.Warehouse;

public sealed class DispatchBatchServiceTests : IAsyncLifetime
{
    private const string VehicleId = "VEH-TEST-001";
    private const decimal MaxWeightKg = 1000;
    private const decimal MaxVolumeM3 = 12;

    private DbContextOptions<AppDbContext> _options = null!;
    private AppDbContext _context = null!;
    private BatchingEngine _engine = null!;
    private DispatchBatchService _service = null!;

    public async Task InitializeAsync()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"dispatch-batch-tests-{Guid.NewGuid():N}")
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();
        _engine = new BatchingEngine();
        _service = new DispatchBatchService(_context, _engine);
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task CreateBatchAsync_AllowsExactWeightAndVolumeFit()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var first = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-EXACT-1", 600, 7);
        var second = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-EXACT-2", 400, 5);

        var result = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { first.Id, second.Id }));

        Assert.Equal("PASS", result.Result);
        Assert.NotNull(result.Batch);
        Assert.Equal(MaxWeightKg, result.Batch!.TotalWeightKg);
        Assert.Equal(MaxVolumeM3, result.Batch.TotalVolumeM3);
        Assert.Empty(result.Issues);
    }

    [Fact]
    public async Task CreateBatchAsync_ReturnsReviseWhenWeightIsExceeded()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var first = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-WEIGHT-1", 700, 2);
        var second = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-WEIGHT-2", 400, 2);

        var result = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { first.Id, second.Id }));

        Assert.Equal("REVISE", result.Result);
        Assert.Null(result.Batch);
        Assert.Contains(result.Issues, issue => issue.Contains("weight capacity", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateBatchAsync_ReturnsReviseWhenVolumeIsExceeded()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var first = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-VOLUME-1", 200, 8);
        var second = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-VOLUME-2", 200, 5);

        var result = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { first.Id, second.Id }));

        Assert.Equal("REVISE", result.Result);
        Assert.Null(result.Batch);
        Assert.Contains(result.Issues, issue => issue.Contains("volume capacity", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateBatchAsync_ReturnsReviseForUnavailablePackage()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var package = await AddPackageAsync(
            warehouse.Id,
            zone.Id,
            "PKG-HOLD",
            100,
            1,
            status: PackageStatus.OnHold);

        var result = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { package.Id }));

        Assert.Equal("REVISE", result.Result);
        Assert.Contains(result.Issues, issue => issue.Contains("available", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task CreateBatchAsync_ReturnsReviseForReceivedPackage()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var package = await AddPackageAsync(
            warehouse.Id,
            zone.Id,
            "PKG-RECEIVED",
            100,
            1,
            status: PackageStatus.Received);

        var result = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { package.Id }));

        Assert.Equal("REVISE", result.Result);
        Assert.Equal(PackageStatus.Received, (await _context.Packages.SingleAsync(item => item.Id == package.Id)).Status);
    }

    [Fact]
    public async Task CreateBatchAsync_ReturnsReviseForMixedWarehouses()
    {
        var (firstWarehouse, firstZone) = await CreateWarehouseAndZoneAsync("A1");
        var (secondWarehouse, secondZone) = await CreateWarehouseAndZoneAsync("B1");
        var firstPackage = await AddPackageAsync(firstWarehouse.Id, firstZone.Id, "PKG-W1", 100, 1);
        var secondPackage = await AddPackageAsync(secondWarehouse.Id, secondZone.Id, "PKG-W2", 100, 1);

        var result = await _service.CreateBatchAsync(
            CreateCommand(firstWarehouse.Id, new[] { firstPackage.Id, secondPackage.Id }));

        Assert.Equal("REVISE", result.Result);
        Assert.Contains(result.Issues, issue => issue.Contains("warehouse", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BatchingEngine_OrdersNormalizedSizeDeterministicallyWithinZone()
    {
        var warehouseId = Guid.NewGuid();
        var candidates = new[]
        {
            Candidate(warehouseId, "A1", "PKG-SMALL", 40, 2),
            Candidate(warehouseId, "A1", "PKG-LARGE", 100, 9),
            Candidate(warehouseId, "A1", "PKG-MEDIUM", 600, 3)
        };

        var plan = _engine.Plan(
            warehouseId,
            new VehicleCapacityContext(VehicleId, 2000, 20),
            candidates);

        Assert.Equal("PASS", plan.Result);
        Assert.Equal(
            new[] { "PKG-LARGE", "PKG-MEDIUM", "PKG-SMALL" },
            plan.Items.OrderBy(item => item.PlacementSequence).Select(item => item.TrackingCode));
    }

    [Fact]
    public void BatchingEngine_OrdersZonesDeterministicallyBeforeNormalizedSize()
    {
        var warehouseId = Guid.NewGuid();
        var candidates = new[]
        {
            Candidate(warehouseId, "B1", "PKG-B", 900, 9),
            Candidate(warehouseId, "A1", "PKG-A", 100, 1)
        };

        var plan = _engine.Plan(
            warehouseId,
            new VehicleCapacityContext(VehicleId, 2000, 20),
            candidates);

        Assert.Equal(
            new[] { "PKG-A", "PKG-B" },
            plan.Items.OrderBy(item => item.PlacementSequence).Select(item => item.TrackingCode));
    }

    [Fact]
    public void BatchingEngine_AssignsHeavierNonFragilePackagesEarlierLoadSequence()
    {
        var warehouseId = Guid.NewGuid();
        var heavy = Candidate(warehouseId, "A1", "PKG-HEAVY", 700, 1);
        var light = Candidate(warehouseId, "A1", "PKG-LIGHT", 300, 1);

        var plan = _engine.Plan(
            warehouseId,
            new VehicleCapacityContext(VehicleId, MaxWeightKg, MaxVolumeM3),
            new[] { light, heavy });

        var heavyItem = plan.Items.Single(item => item.PackageId == heavy.PackageId);
        var lightItem = plan.Items.Single(item => item.PackageId == light.PackageId);

        Assert.True(heavyItem.LoadSequence < lightItem.LoadSequence);
    }

    [Fact]
    public void BatchingEngine_PlacesFragilePackagesInFinalTopSafeSegment()
    {
        var warehouseId = Guid.NewGuid();
        var candidates = new[]
        {
            Candidate(warehouseId, "A1", "PKG-NORMAL-1", 600, 1),
            Candidate(warehouseId, "A1", "PKG-FRAGILE", 100, 1, isFragile: true),
            Candidate(warehouseId, "A1", "PKG-NORMAL-2", 200, 1)
        };

        var plan = _engine.Plan(
            warehouseId,
            new VehicleCapacityContext(VehicleId, MaxWeightKg, MaxVolumeM3),
            candidates);

        var orderedItems = plan.Items.OrderBy(item => item.LoadSequence).ToList();
        var firstFragileIndex = orderedItems.FindIndex(item => item.IsFragile);

        Assert.True(firstFragileIndex > -1);
        Assert.All(orderedItems.Skip(firstFragileIndex), item => Assert.True(item.IsFragile));
    }

    [Fact]
    public async Task GetValidationAsync_FailsForUnsafeFragilePlacement()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var fragile = await AddPackageAsync(
            warehouse.Id,
            zone.Id,
            "PKG-FRAGILE",
            100,
            1,
            isFragile: true,
            status: PackageStatus.Reserved);
        var nonFragile = await AddPackageAsync(
            warehouse.Id,
            zone.Id,
            "PKG-NORMAL",
            200,
            1,
            status: PackageStatus.Reserved);
        var batch = new DispatchBatch
        {
            Id = Guid.NewGuid(),
            WarehouseId = warehouse.Id,
            VehicleId = VehicleId,
            MaxWeightKg = MaxWeightKg,
            MaxVolumeM3 = MaxVolumeM3,
            Status = DispatchBatchStatus.Reserved,
            CreatedAt = DateTime.UtcNow
        };

        batch.Items.Add(new DispatchBatchItem
        {
            Id = Guid.NewGuid(),
            DispatchBatchId = batch.Id,
            PackageId = fragile.Id,
            Package = fragile,
            LoadSequence = 1
        });
        batch.Items.Add(new DispatchBatchItem
        {
            Id = Guid.NewGuid(),
            DispatchBatchId = batch.Id,
            PackageId = nonFragile.Id,
            Package = nonFragile,
            LoadSequence = 2
        });
        _context.DispatchBatches.Add(batch);
        await _context.SaveChangesAsync();

        var validation = await _service.GetValidationAsync(batch.Id);

        Assert.Equal("FAIL", validation.Result);
        Assert.False(validation.FragileLoadOrderValid);
        Assert.Contains(validation.Issues, issue => issue.Contains("top-safe", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void BatchingEngine_ProducesSamePlanForRepeatedIdenticalInput()
    {
        var warehouseId = Guid.NewGuid();
        var candidates = new[]
        {
            Candidate(warehouseId, "B1", "PKG-2", 200, 3),
            Candidate(warehouseId, "A1", "PKG-1", 700, 1),
            Candidate(warehouseId, "A1", "PKG-3", 100, 6, isFragile: true)
        };
        var capacity = new VehicleCapacityContext(VehicleId, MaxWeightKg, MaxVolumeM3);

        var firstPlan = _engine.Plan(warehouseId, capacity, candidates);
        var secondPlan = _engine.Plan(warehouseId, capacity, candidates.Reverse().ToArray());

        Assert.Equal(firstPlan.Result, secondPlan.Result);
        Assert.Equal(
            firstPlan.Items.Select(item => (item.PackageId, item.PlacementSequence, item.LoadSequence)),
            secondPlan.Items.Select(item => (item.PackageId, item.PlacementSequence, item.LoadSequence)));
    }

    [Fact]
    public async Task CreateBatchAsync_ReservesAvailablePackagesAfterSuccessfulPlan()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var package = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-RESERVE", 100, 1);

        var result = await _service.CreateBatchAsync(CreateCommand(warehouse.Id, new[] { package.Id }));

        Assert.Equal("PASS", result.Result);
        Assert.Equal(PackageStatus.Reserved, (await _context.Packages.SingleAsync(item => item.Id == package.Id)).Status);
    }

    [Fact]
    public async Task CreateBatchAsync_DoesNotReservePackagesForRevisedPlan()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var first = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-NO-RESERVE-1", 800, 1);
        var second = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-NO-RESERVE-2", 300, 1);

        var result = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { first.Id, second.Id }));

        Assert.Equal("REVISE", result.Result);
        Assert.All(
            await _context.Packages.Where(item => item.Id == first.Id || item.Id == second.Id).ToListAsync(),
            package => Assert.Equal(PackageStatus.Available, package.Status));
    }

    [Fact]
    public async Task CreateBatchAsync_DoesNotPersistPartialBatchForRevisedPlan()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var first = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-PARTIAL-1", 900, 1);
        var second = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-PARTIAL-2", 200, 1);

        var result = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { first.Id, second.Id }));

        Assert.Equal("REVISE", result.Result);
        Assert.Equal(0, await _context.DispatchBatches.CountAsync());
        Assert.Equal(0, await _context.DispatchBatchItems.CountAsync());
    }

    [Fact]
    public async Task CreateBatchAsync_RollsBackBatchAndReservationsWhenSaveFails()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var package = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-SAVE-FAIL", 100, 1);
        var failingService = new DispatchBatchService(
            new FailingSaveContext(_context),
            _engine);

        await Assert.ThrowsAsync<DbUpdateException>(
            () => failingService.CreateBatchAsync(CreateCommand(warehouse.Id, new[] { package.Id })));

        await using var verificationContext = new AppDbContext(_options);
        Assert.Equal(
            PackageStatus.Available,
            (await verificationContext.Packages.SingleAsync(item => item.Id == package.Id)).Status);
        Assert.Equal(0, await verificationContext.DispatchBatches.CountAsync());
        Assert.Equal(0, await verificationContext.DispatchBatchItems.CountAsync());
    }

    [Fact]
    public async Task GetValidationAsync_ReturnsAllSuccessfulRuleResults()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var normal = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-VALID-NORMAL", 500, 5);
        var fragile = await AddPackageAsync(
            warehouse.Id,
            zone.Id,
            "PKG-VALID-FRAGILE",
            100,
            1,
            isFragile: true);
        var creation = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { fragile.Id, normal.Id }));

        var validation = await _service.GetValidationAsync(creation.Batch!.Id);

        Assert.Equal("PASS", validation.Result);
        Assert.True(validation.WeightCapacityValid);
        Assert.True(validation.VolumeCapacityValid);
        Assert.True(validation.PackageAvailabilityValid);
        Assert.True(validation.WarehouseConsistent);
        Assert.True(validation.FragileLoadOrderValid);
        Assert.Empty(validation.Issues);
    }

    [Fact]
    public async Task GetThroughputAsync_RespectsDateRange()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var inRange = await AddPackageAsync(
            warehouse.Id,
            zone.Id,
            "PKG-IN-RANGE",
            100,
            1,
            receivedAt: new DateTime(2026, 9, 10, 12, 0, 0, DateTimeKind.Utc));
        await AddPackageAsync(
            warehouse.Id,
            zone.Id,
            "PKG-OUT-OF-RANGE",
            200,
            2,
            receivedAt: new DateTime(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc));

        var report = await _service.GetThroughputAsync(
            warehouse.Id,
            new WarehouseThroughputQuery(
                new DateTime(2026, 9, 10, 0, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 9, 11, 0, 0, 0, DateTimeKind.Utc)));

        Assert.Equal(1, report.ReceivedPackageCount);
        Assert.Equal(inRange.WeightKg, report.ReceivedWeightKg);
        Assert.Equal(inRange.VolumeM3, report.ReceivedVolumeM3);
    }

    [Fact]
    public async Task GetThroughputAsync_ReturnsCorrectPackageAndBatchCounts()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync("A1");
        var now = DateTime.UtcNow;
        var reserved = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-THROUGHPUT-1", 100, 1, receivedAt: now);
        var dispatched = await AddPackageAsync(warehouse.Id, zone.Id, "PKG-THROUGHPUT-2", 200, 2, receivedAt: now);
        await AddPackageAsync(warehouse.Id, zone.Id, "PKG-THROUGHPUT-3", 300, 3, receivedAt: now);
        var creation = await _service.CreateBatchAsync(
            CreateCommand(warehouse.Id, new[] { reserved.Id, dispatched.Id }));

        var dispatchedPackage = await _context.Packages.SingleAsync(item => item.Id == dispatched.Id);
        dispatchedPackage.Status = PackageStatus.Dispatched;
        await _context.SaveChangesAsync();

        var report = await _service.GetThroughputAsync(
            warehouse.Id,
            new WarehouseThroughputQuery(now.AddMinutes(-1), now.AddMinutes(1)));

        Assert.Equal(3, report.ReceivedPackageCount);
        Assert.Equal(1, report.ReservedPackageCount);
        Assert.Equal(1, report.DispatchedPackageCount);
        Assert.Equal(1, report.CreatedDispatchBatchCount);
        Assert.Equal(2, report.BatchedPackageCount);
        Assert.NotNull(creation.Batch);
    }

    [Fact]
    public async Task GetThroughputAsync_RejectsInvalidDateRange()
    {
        var (warehouse, _) = await CreateWarehouseAndZoneAsync("A1");

        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.GetThroughputAsync(
                warehouse.Id,
                new WarehouseThroughputQuery(
                    new DateTime(2026, 9, 11, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(2026, 9, 10, 0, 0, 0, DateTimeKind.Utc))));
    }

    private async Task<(WarehouseEntity Warehouse, StorageZone Zone)> CreateWarehouseAndZoneAsync(string zoneCode)
    {
        var warehouse = new WarehouseEntity
        {
            Id = Guid.NewGuid(),
            Name = $"Warehouse {zoneCode}",
            Location = "Colombo",
            TotalVolumeM3 = 10000,
            OccupiedVolumeM3 = 0,
            CreatedAt = DateTime.UtcNow
        };
        var zone = new StorageZone
        {
            Id = Guid.NewGuid(),
            WarehouseId = warehouse.Id,
            Name = $"Zone {zoneCode}",
            Code = zoneCode,
            TotalVolumeM3 = 10000,
            OccupiedVolumeM3 = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Warehouses.Add(warehouse);
        _context.StorageZones.Add(zone);
        await _context.SaveChangesAsync();

        return (warehouse, zone);
    }

    private async Task<Package> AddPackageAsync(
        Guid warehouseId,
        Guid zoneId,
        string trackingCode,
        decimal weightKg,
        decimal volumeM3,
        bool isFragile = false,
        PackageStatus status = PackageStatus.Available,
        DateTime? receivedAt = null)
    {
        var package = new Package
        {
            Id = Guid.NewGuid(),
            OrderId = Guid.NewGuid(),
            WarehouseId = warehouseId,
            StorageZoneId = zoneId,
            TrackingCode = trackingCode,
            WeightKg = weightKg,
            VolumeM3 = volumeM3,
            IsFragile = isFragile,
            Status = status,
            ReceivedAt = receivedAt ?? DateTime.UtcNow
        };

        _context.Packages.Add(package);
        await _context.SaveChangesAsync();

        return package;
    }

    private static CreateDispatchBatchCommand CreateCommand(
        Guid warehouseId,
        IReadOnlyCollection<Guid> packageIds,
        decimal maxWeightKg = MaxWeightKg,
        decimal maxVolumeM3 = MaxVolumeM3) =>
        new(
            warehouseId,
            new VehicleCapacityContext(VehicleId, maxWeightKg, maxVolumeM3),
            packageIds);

    private static BatchingCandidate Candidate(
        Guid warehouseId,
        string zoneCode,
        string trackingCode,
        decimal weightKg,
        decimal volumeM3,
        bool isFragile = false) =>
        new(
            Guid.NewGuid(),
            warehouseId,
            zoneCode,
            trackingCode,
            weightKg,
            volumeM3,
            isFragile,
            PackageStatus.Available);

    private sealed class FailingSaveContext : IAppDbContext
    {
        private readonly AppDbContext _context;

        public FailingSaveContext(AppDbContext context)
        {
            _context = context;
        }

        public DbSet<WarehouseEntity> Warehouses => _context.Warehouses;
        public DbSet<StorageZone> StorageZones => _context.StorageZones;
        public DbSet<Package> Packages => _context.Packages;
        public DbSet<DispatchBatch> DispatchBatches => _context.DispatchBatches;
        public DbSet<DispatchBatchItem> DispatchBatchItems => _context.DispatchBatchItems;
        public void ClearChangeTracker() => _context.ClearChangeTracker();

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            Task.FromException<int>(new DbUpdateException("Simulated dispatch batch persistence failure."));

        public Task<IDbContextTransaction> BeginTransactionAsync(
            IsolationLevel isolationLevel,
            CancellationToken cancellationToken = default) =>
            _context.BeginTransactionAsync(isolationLevel, cancellationToken);
    }
}
