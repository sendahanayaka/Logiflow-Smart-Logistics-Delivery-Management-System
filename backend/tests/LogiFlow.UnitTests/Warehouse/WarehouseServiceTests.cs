using System.Data;
using System;
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
using PackageEntity = LogiFlow.Domain.Entities.Package;
using StorageZoneEntity = LogiFlow.Domain.Entities.StorageZone;
using WarehouseEntity = LogiFlow.Domain.Entities.Warehouse;
using Xunit;

namespace LogiFlow.UnitTests.Warehouse;

public sealed class WarehouseServiceTests : IAsyncLifetime
{
    private DbContextOptions<AppDbContext> _options = null!;
    private AppDbContext _context = null!;
    private WarehouseService _service = null!;

    public async Task InitializeAsync()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"warehouse-tests-{Guid.NewGuid():N}")
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();
        _service = new WarehouseService(_context);
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task CreateWarehouseAsync_PersistsWarehouseWithEmptyCapacity()
    {
        var warehouse = await CreateWarehouseAsync(totalVolumeM3: 25);

        Assert.Equal("Colombo Central", warehouse.Name);
        Assert.Equal(25, warehouse.TotalVolumeM3);
        Assert.Equal(0, warehouse.OccupiedVolumeM3);
        Assert.True(await _context.Warehouses.AnyAsync(item => item.Id == warehouse.Id));
    }

    [Fact]
    public async Task CreateStorageZoneAsync_PersistsZoneForWarehouse()
    {
        var warehouse = await CreateWarehouseAsync();

        var zone = await CreateZoneAsync(warehouse.Id, "cold", "Cold Storage", 40);

        Assert.Equal(warehouse.Id, zone.WarehouseId);
        Assert.Equal("COLD", zone.Code);
        Assert.True(await _context.StorageZones.AnyAsync(item => item.Id == zone.Id));
    }

    [Fact]
    public async Task ReceivePackageAsync_PersistsPackageAndUpdatesBothCapacities()
    {
        var warehouse = await CreateWarehouseAsync(totalVolumeM3: 20);
        var zone = await CreateZoneAsync(warehouse.Id, "a1", "Zone A1", 10);

        var package = await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-100", volumeM3: 4);

        var storedWarehouse = await _context.Warehouses.SingleAsync(item => item.Id == warehouse.Id);
        var storedZone = await _context.StorageZones.SingleAsync(item => item.Id == zone.Id);

        Assert.Equal("PKG-100", package.TrackingCode);
        Assert.Equal("Received", package.Status);
        Assert.Equal(4, storedWarehouse.OccupiedVolumeM3);
        Assert.Equal(4, storedZone.OccupiedVolumeM3);
        Assert.True(await _context.Packages.AnyAsync(item => item.Id == package.Id));
    }

    [Fact]
    public async Task ReceivePackageAsync_RejectsDuplicateTrackingCode()
    {
        var warehouse = await CreateWarehouseAsync();
        var zone = await CreateZoneAsync(warehouse.Id);
        await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-duplicate");

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => ReceivePackageAsync(warehouse.Id, zone.Id, "PKG-DUPLICATE"));

        Assert.Contains("already been received", exception.Message);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task ReceivePackageAsync_RejectsNonPositiveWeight(decimal weightKg)
    {
        var warehouse = await CreateWarehouseAsync();
        var zone = await CreateZoneAsync(warehouse.Id);

        await Assert.ThrowsAsync<ArgumentException>(
            () => ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-weight", weightKg: weightKg));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task ReceivePackageAsync_RejectsNonPositiveVolume(decimal volumeM3)
    {
        var warehouse = await CreateWarehouseAsync();
        var zone = await CreateZoneAsync(warehouse.Id);

        await Assert.ThrowsAsync<ArgumentException>(
            () => ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-volume", volumeM3: volumeM3));
    }

    [Fact]
    public async Task ReceivePackageAsync_RejectsZoneFromAnotherWarehouse()
    {
        var firstWarehouse = await CreateWarehouseAsync();
        var secondWarehouse = await CreateWarehouseAsync();
        var secondWarehouseZone = await CreateZoneAsync(secondWarehouse.Id);

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => ReceivePackageAsync(firstWarehouse.Id, secondWarehouseZone.Id, "pkg-mismatch"));

        Assert.Contains("does not belong", exception.Message);
    }

    [Fact]
    public async Task ReceivePackageAsync_AllowsExactWarehouseAndZoneCapacity()
    {
        var warehouse = await CreateWarehouseAsync(totalVolumeM3: 5);
        var zone = await CreateZoneAsync(warehouse.Id, totalVolumeM3: 5);

        await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-exact", volumeM3: 5);

        var storedWarehouse = await _context.Warehouses.SingleAsync(item => item.Id == warehouse.Id);
        var storedZone = await _context.StorageZones.SingleAsync(item => item.Id == zone.Id);
        Assert.Equal(5, storedWarehouse.OccupiedVolumeM3);
        Assert.Equal(5, storedZone.OccupiedVolumeM3);
    }

    [Fact]
    public async Task ReceivePackageAsync_RejectsWarehouseCapacityOverflow()
    {
        var warehouse = await CreateWarehouseAsync(totalVolumeM3: 5);
        var zone = await CreateZoneAsync(warehouse.Id, totalVolumeM3: 10);
        await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-first", volumeM3: 4);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-overflow", volumeM3: 2));

        Assert.Contains("warehouse", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ReceivePackageAsync_RejectsStorageZoneCapacityOverflow()
    {
        var warehouse = await CreateWarehouseAsync(totalVolumeM3: 10);
        var zone = await CreateZoneAsync(warehouse.Id, totalVolumeM3: 5);
        await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-first", volumeM3: 4);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-overflow", volumeM3: 2));

        Assert.Contains("storage zone", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ReceivePackageAsync_RollsBackCapacityAndPackageWhenSavingFails()
    {
        var warehouse = await CreateWarehouseAsync(totalVolumeM3: 10);
        var zone = await CreateZoneAsync(warehouse.Id, totalVolumeM3: 10);
        var failingService = new WarehouseService(new FailingSaveContext(_context));

        await Assert.ThrowsAsync<DbUpdateException>(
            () => failingService.ReceivePackageAsync(new ReceivePackageCommand(
                Guid.NewGuid(),
                warehouse.Id,
                zone.Id,
                "pkg-rollback",
                2,
                3,
                false,
                null)));

        await using var verificationContext = new AppDbContext(_options);
        var persistedWarehouse = await verificationContext.Warehouses.SingleAsync(item => item.Id == warehouse.Id);
        var persistedZone = await verificationContext.StorageZones.SingleAsync(item => item.Id == zone.Id);

        Assert.Equal(0, persistedWarehouse.OccupiedVolumeM3);
        Assert.Equal(0, persistedZone.OccupiedVolumeM3);
        Assert.False(await verificationContext.Packages.AnyAsync(item => item.TrackingCode == "PKG-ROLLBACK"));
    }

    [Fact]
    public async Task GetPackagesAsync_FiltersByStatus()
    {
        var warehouse = await CreateWarehouseAsync();
        var zone = await CreateZoneAsync(warehouse.Id);
        var received = await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-received");
        await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-hold");

        var heldPackage = await _context.Packages.SingleAsync(item => item.TrackingCode == "PKG-HOLD");
        heldPackage.Status = PackageStatus.OnHold;
        await _context.SaveChangesAsync();

        var result = await _service.GetPackagesAsync(
            warehouse.Id,
            new PackageInventoryQuery(1, 20, PackageStatus.OnHold, null, null));

        Assert.Single(result.Items);
        Assert.DoesNotContain(result.Items, item => item.Id == received.Id);
        Assert.Equal("OnHold", result.Items.Single().Status);
    }

    [Fact]
    public async Task GetPackagesAsync_FiltersByStorageZone()
    {
        var warehouse = await CreateWarehouseAsync();
        var firstZone = await CreateZoneAsync(warehouse.Id, "a1");
        var secondZone = await CreateZoneAsync(warehouse.Id, "a2");
        await ReceivePackageAsync(warehouse.Id, firstZone.Id, "pkg-a1");
        var expected = await ReceivePackageAsync(warehouse.Id, secondZone.Id, "pkg-a2");

        var result = await _service.GetPackagesAsync(
            warehouse.Id,
            new PackageInventoryQuery(1, 20, null, secondZone.Id, null));

        Assert.Single(result.Items);
        Assert.Equal(expected.Id, result.Items.Single().Id);
    }

    [Fact]
    public async Task GetPackagesAsync_SearchesTrackingCodeCaseInsensitively()
    {
        var warehouse = await CreateWarehouseAsync();
        var zone = await CreateZoneAsync(warehouse.Id);
        var expected = await ReceivePackageAsync(warehouse.Id, zone.Id, "alpha-123");
        await ReceivePackageAsync(warehouse.Id, zone.Id, "beta-456");

        var result = await _service.GetPackagesAsync(
            warehouse.Id,
            new PackageInventoryQuery(1, 20, null, null, "alpha"));

        Assert.Single(result.Items);
        Assert.Equal(expected.Id, result.Items.Single().Id);
    }

    [Fact]
    public async Task GetPackagesAsync_PaginatesResults()
    {
        var warehouse = await CreateWarehouseAsync();
        var zone = await CreateZoneAsync(warehouse.Id);
        await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-001");
        await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-002");
        await ReceivePackageAsync(warehouse.Id, zone.Id, "pkg-003");

        var result = await _service.GetPackagesAsync(
            warehouse.Id,
            new PackageInventoryQuery(2, 2, null, null, null));

        Assert.Equal(3, result.TotalCount);
        Assert.Equal(2, result.Page);
        Assert.Equal(2, result.PageSize);
        Assert.Equal(2, result.TotalPages);
        Assert.Single(result.Items);
    }

    private async Task<WarehouseResponse> CreateWarehouseAsync(decimal totalVolumeM3 = 100) =>
        await _service.CreateWarehouseAsync(
            new CreateWarehouseCommand("Colombo Central", "Colombo", totalVolumeM3));

    private async Task<StorageZoneResponse> CreateZoneAsync(
        Guid warehouseId,
        string code = "A1",
        string name = "Zone A1",
        decimal totalVolumeM3 = 100) =>
        await _service.CreateStorageZoneAsync(
            warehouseId,
            new CreateStorageZoneCommand(name, code, totalVolumeM3));

    private async Task<PackageResponse> ReceivePackageAsync(
        Guid warehouseId,
        Guid zoneId,
        string trackingCode,
        decimal weightKg = 2,
        decimal volumeM3 = 1) =>
        await _service.ReceivePackageAsync(
            new ReceivePackageCommand(
                Guid.NewGuid(),
                warehouseId,
                zoneId,
                trackingCode,
                weightKg,
                volumeM3,
                false,
                null));

    private sealed class FailingSaveContext : IAppDbContext
    {
        private readonly AppDbContext _context;

        public FailingSaveContext(AppDbContext context)
        {
            _context = context;
        }

        public DbSet<WarehouseEntity> Warehouses => _context.Warehouses;
        public DbSet<StorageZoneEntity> StorageZones => _context.StorageZones;
        public DbSet<PackageEntity> Packages => _context.Packages;
        public DbSet<LogiFlow.Domain.Entities.User> Users => _context.Users;
        public DbSet<LogiFlow.Domain.Entities.Role> Roles => _context.Roles;

        // [S4] delivery-execution DbSets added to IAppDbContext; delegate to the inner context.
        public DbSet<LogiFlow.Domain.Entities.AgentWorkflow> AgentWorkflows => _context.AgentWorkflows;
        public DbSet<LogiFlow.Domain.Entities.RouteStop> RouteStops => _context.RouteStops;
        public DbSet<LogiFlow.Domain.Entities.Shipment> Shipments => _context.Shipments;
        public DbSet<LogiFlow.Domain.Entities.ApprovalDecision> ApprovalDecisions => _context.ApprovalDecisions;
        public DbSet<LogiFlow.Domain.Entities.TrackingEvent> TrackingEvents => _context.TrackingEvents;
        public DbSet<LogiFlow.Domain.Entities.ProofOfDelivery> ProofOfDeliveries => _context.ProofOfDeliveries;

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            Task.FromException<int>(new DbUpdateException("Simulated package persistence failure."));

        public Task<IDbContextTransaction> BeginTransactionAsync(
            IsolationLevel isolationLevel,
            CancellationToken cancellationToken = default) =>
            _context.BeginTransactionAsync(isolationLevel, cancellationToken);
    }
}
