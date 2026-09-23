using System;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using LogiFlow.Api.Controllers;
using LogiFlow.Api.DTOs.Warehouse;
using LogiFlow.Api.Middleware;
using LogiFlow.Api.Validators.Warehouse;
using LogiFlow.Application.Common;
using LogiFlow.Application.Warehouse;
using LogiFlow.Application.Warehouse.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;
using Xunit;
using WarehouseEntity = LogiFlow.Domain.Entities.Warehouse;

namespace LogiFlow.UnitTests.Warehouse;

public sealed class WarehouseReviewFixTests : IAsyncLifetime
{
    private DbContextOptions<AppDbContext> _options = null!;
    private AppDbContext _context = null!;
    private WarehouseService _service = null!;

    public async Task InitializeAsync()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"warehouse-review-tests-{Guid.NewGuid():N}")
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

    [Theory]
    [InlineData("23505")]
    [InlineData("40001")]
    [InlineData("23514")]
    public async Task ExceptionMiddleware_MapsExpectedPostgresConflictsToStructured409(string sqlState)
    {
        var postgresException = new PostgresException(
            "Simulated database conflict.",
            "ERROR",
            "ERROR",
            sqlState);
        var context = await InvokeMiddlewareAsync(
            new DbUpdateException("Simulated update failure.", postgresException));

        Assert.Equal(StatusCodes.Status409Conflict, context.Response.StatusCode);
        Assert.Equal("application/json; charset=utf-8", context.Response.ContentType);
        Assert.Contains("\"status\":409", await ReadResponseBodyAsync(context));
        Assert.Contains("\"title\":\"Conflict\"", await ReadResponseBodyAsync(context));
    }

    [Fact]
    public async Task ExceptionMiddleware_MapsConcurrencyUpdateConflictTo409()
    {
        var context = await InvokeMiddlewareAsync(
            new DbUpdateConcurrencyException("Simulated concurrency conflict."));

        Assert.Equal(StatusCodes.Status409Conflict, context.Response.StatusCode);
        Assert.Contains("\"status\":409", await ReadResponseBodyAsync(context));
    }

    [Fact]
    public async Task ExceptionMiddleware_LeavesUnexpectedExceptionsAs500()
    {
        var context = await InvokeMiddlewareAsync(
            new InvalidOperationException("Unexpected programming failure."));

        Assert.Equal(StatusCodes.Status500InternalServerError, context.Response.StatusCode);
        Assert.Contains("\"status\":500", await ReadResponseBodyAsync(context));
        Assert.DoesNotContain("\"title\":\"Conflict\"", await ReadResponseBodyAsync(context));
    }

    [Fact]
    public async Task GetPackagesAsync_TreatsUnderscoreAsLiteralTrackingCodeCharacter()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync();
        var literalMatch = await AddPackageAsync(warehouse.Id, zone.Id, "A_B");
        await AddPackageAsync(warehouse.Id, zone.Id, "AXB");

        var result = await _service.GetPackagesAsync(
            warehouse.Id,
            new PackageInventoryQuery(1, 20, null, null, "a_b"));

        Assert.Single(result.Items);
        Assert.Equal(literalMatch.Id, result.Items.Single().Id);
    }

    [Fact]
    public async Task GetPackagesAsync_TreatsPercentAsLiteralTrackingCodeCharacter()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync();
        var literalMatch = await AddPackageAsync(warehouse.Id, zone.Id, "A%CODE");
        await AddPackageAsync(warehouse.Id, zone.Id, "AXCODE");

        var result = await _service.GetPackagesAsync(
            warehouse.Id,
            new PackageInventoryQuery(1, 20, null, null, "%"));

        Assert.Single(result.Items);
        Assert.Equal(literalMatch.Id, result.Items.Single().Id);
    }

    [Fact]
    public async Task GetPackages_RejectsUndefinedStatusWithBadRequest()
    {
        var (warehouse, _) = await CreateWarehouseAndZoneAsync();
        var controller = CreateController();

        var action = await controller.GetPackages(
            warehouse.Id,
            status: (PackageStatus)99);

        Assert.IsType<BadRequestObjectResult>(action.Result);
    }

    [Fact]
    public async Task GetPackages_AcceptsDefinedStatus()
    {
        var (warehouse, zone) = await CreateWarehouseAndZoneAsync();
        await AddPackageAsync(warehouse.Id, zone.Id, "PKG-RECEIVED", PackageStatus.Received);
        var controller = CreateController();

        var action = await controller.GetPackages(
            warehouse.Id,
            status: PackageStatus.Received);

        var result = Assert.IsType<OkObjectResult>(action.Result);
        var payload = Assert.IsType<PagedResult<PackageResponse>>(result.Value);
        Assert.Single(payload.Items);
        Assert.Equal("Received", payload.Items.Single().Status);
    }

    [Fact]
    public async Task CreateEndpoints_Return201WithoutInvalidLocationHeaders()
    {
        var controller = CreateController();

        var warehouseAction = await controller.CreateWarehouse(
            new CreateWarehouseRequest("Colombo Central", "Colombo", 100),
            CancellationToken.None);
        var warehouseResult = Assert.IsType<ObjectResult>(warehouseAction.Result);
        var warehouse = Assert.IsType<WarehouseResponse>(warehouseResult.Value);

        Assert.Equal(StatusCodes.Status201Created, warehouseResult.StatusCode);
        Assert.IsNotType<CreatedResult>(warehouseResult);
        Assert.False(controller.Response.Headers.ContainsKey("Location"));

        var zoneAction = await controller.CreateStorageZone(
            warehouse.Id,
            new CreateStorageZoneRequest("Zone A1", "A1", 100),
            CancellationToken.None);
        var zoneResult = Assert.IsType<ObjectResult>(zoneAction.Result);
        var zone = Assert.IsType<StorageZoneResponse>(zoneResult.Value);

        Assert.Equal(StatusCodes.Status201Created, zoneResult.StatusCode);
        Assert.IsNotType<CreatedResult>(zoneResult);
        Assert.False(controller.Response.Headers.ContainsKey("Location"));

        var packageAction = await controller.ReceivePackage(
            new CreatePackageRequest(
                Guid.NewGuid(),
                warehouse.Id,
                zone.Id,
                "PKG-LOCATION",
                1,
                1,
                false,
                null),
            CancellationToken.None);
        var packageResult = Assert.IsType<ObjectResult>(packageAction.Result);

        Assert.Equal(StatusCodes.Status201Created, packageResult.StatusCode);
        Assert.IsNotType<CreatedResult>(packageResult);
        Assert.False(controller.Response.Headers.ContainsKey("Location"));
    }

    private WarehouseController CreateController()
    {
        return new WarehouseController(
            _service,
            new CreateWarehouseRequestValidator(),
            new CreateStorageZoneRequestValidator(),
            new CreatePackageRequestValidator(),
            new NoOpDispatchBatchService())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            }
        };
    }

    private async Task<(WarehouseEntity Warehouse, StorageZone Zone)> CreateWarehouseAndZoneAsync()
    {
        var warehouse = new WarehouseEntity
        {
            Id = Guid.NewGuid(),
            Name = "Review Warehouse",
            Location = "Colombo",
            TotalVolumeM3 = 100,
            OccupiedVolumeM3 = 0,
            CreatedAt = DateTime.UtcNow
        };
        var zone = new StorageZone
        {
            Id = Guid.NewGuid(),
            WarehouseId = warehouse.Id,
            Name = "Review Zone",
            Code = "A1",
            TotalVolumeM3 = 100,
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
        PackageStatus status = PackageStatus.Received)
    {
        var package = new Package
        {
            Id = Guid.NewGuid(),
            OrderId = Guid.NewGuid(),
            WarehouseId = warehouseId,
            StorageZoneId = zoneId,
            TrackingCode = trackingCode,
            WeightKg = 1,
            VolumeM3 = 1,
            Status = status,
            ReceivedAt = DateTime.UtcNow
        };

        _context.Packages.Add(package);
        await _context.SaveChangesAsync();
        return package;
    }

    private static async Task<DefaultHttpContext> InvokeMiddlewareAsync(Exception exception)
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionMiddleware(_ => Task.FromException(exception));

        await middleware.InvokeAsync(context);

        return context;
    }

    private static async Task<string> ReadResponseBodyAsync(DefaultHttpContext context)
    {
        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }

    private sealed class NoOpDispatchBatchService : IDispatchBatchService
    {
        public Task<DispatchBatchCreationResponse> CreateBatchAsync(
            CreateDispatchBatchCommand command,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<DispatchBatchCreationResponse> ReplaceItemsAsync(
            Guid batchId,
            ReplaceDispatchBatchItemsCommand command,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<DispatchBatchValidationResponse> GetValidationAsync(
            Guid batchId,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<DispatchBatchValidationContextResponse> GetValidationContextAsync(
            Guid batchId,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<WarehouseThroughputResponse> GetThroughputAsync(
            Guid warehouseId,
            WarehouseThroughputQuery query,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
