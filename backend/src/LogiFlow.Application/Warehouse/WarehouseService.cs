using System.Data;
using LogiFlow.Application.Common;
using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Warehouse.DTOs;
using LogiFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using PackageEntity = LogiFlow.Domain.Entities.Package;
using StorageZoneEntity = LogiFlow.Domain.Entities.StorageZone;
using WarehouseEntity = LogiFlow.Domain.Entities.Warehouse;

namespace LogiFlow.Application.Warehouse;

public class WarehouseService : IWarehouseService
{
    private readonly IAppDbContext _context;

    public WarehouseService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyCollection<WarehouseResponse>> GetWarehousesAsync(
        CancellationToken cancellationToken = default) =>
        await _context.Warehouses
            .AsNoTracking()
            .OrderBy(warehouse => warehouse.Name)
            .ThenBy(warehouse => warehouse.Id)
            .Select(warehouse => new WarehouseResponse(
                warehouse.Id,
                warehouse.Name,
                warehouse.Location,
                warehouse.TotalVolumeM3,
                warehouse.OccupiedVolumeM3,
                warehouse.CreatedAt,
                warehouse.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<WarehouseResponse> GetWarehouseAsync(
        Guid warehouseId,
        CancellationToken cancellationToken = default)
    {
        EnsureWarehouseId(warehouseId);

        var warehouse = await _context.Warehouses
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == warehouseId, cancellationToken);

        if (warehouse is null)
        {
            throw new KeyNotFoundException($"Warehouse '{warehouseId}' was not found.");
        }

        return MapWarehouse(warehouse);
    }

    public async Task<IReadOnlyCollection<StorageZoneResponse>> GetStorageZonesAsync(
        Guid warehouseId,
        CancellationToken cancellationToken = default)
    {
        EnsureWarehouseId(warehouseId);

        var warehouseExists = await _context.Warehouses
            .AnyAsync(warehouse => warehouse.Id == warehouseId, cancellationToken);

        if (!warehouseExists)
        {
            throw new KeyNotFoundException($"Warehouse '{warehouseId}' was not found.");
        }

        return await _context.StorageZones
            .AsNoTracking()
            .Where(zone => zone.WarehouseId == warehouseId)
            .OrderBy(zone => zone.Code)
            .ThenBy(zone => zone.Id)
            .Select(zone => new StorageZoneResponse(
                zone.Id,
                zone.WarehouseId,
                zone.Name,
                zone.Code,
                zone.TotalVolumeM3,
                zone.OccupiedVolumeM3,
                zone.CreatedAt,
                zone.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<WarehouseResponse> CreateWarehouseAsync(
        CreateWarehouseCommand command,
        CancellationToken cancellationToken = default)
    {
        ValidateWarehouse(command);

        var warehouse = new WarehouseEntity
        {
            Id = Guid.NewGuid(),
            Name = command.Name.Trim(),
            Location = command.Location.Trim(),
            TotalVolumeM3 = command.TotalVolumeM3,
            OccupiedVolumeM3 = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync(cancellationToken);

        return MapWarehouse(warehouse);
    }

    public async Task<StorageZoneResponse> CreateStorageZoneAsync(
        Guid warehouseId,
        CreateStorageZoneCommand command,
        CancellationToken cancellationToken = default)
    {
        if (warehouseId == Guid.Empty)
        {
            throw new ArgumentException("Warehouse ID is required.", nameof(warehouseId));
        }

        ValidateStorageZone(command);

        var warehouseExists = await _context.Warehouses
            .AnyAsync(warehouse => warehouse.Id == warehouseId, cancellationToken);

        if (!warehouseExists)
        {
            throw new KeyNotFoundException($"Warehouse '{warehouseId}' was not found.");
        }

        var normalizedCode = command.Code.Trim().ToUpperInvariant();
        var duplicateCode = await _context.StorageZones
            .AnyAsync(
                zone => zone.WarehouseId == warehouseId && zone.Code == normalizedCode,
                cancellationToken);

        if (duplicateCode)
        {
            throw new InvalidOperationException(
                $"Storage zone code '{normalizedCode}' already exists in this warehouse.");
        }

        var zone = new StorageZoneEntity
        {
            Id = Guid.NewGuid(),
            WarehouseId = warehouseId,
            Name = command.Name.Trim(),
            Code = normalizedCode,
            TotalVolumeM3 = command.TotalVolumeM3,
            OccupiedVolumeM3 = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.StorageZones.Add(zone);
        await _context.SaveChangesAsync(cancellationToken);

        return MapStorageZone(zone);
    }

    public async Task<PackageResponse> ReceivePackageAsync(
        ReceivePackageCommand command,
        CancellationToken cancellationToken = default)
    {
        ValidatePackage(command);

        await using var transaction = await _context.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var trackingCode = NormalizeTrackingCode(command.TrackingCode);
            var packageAlreadyReceived = await _context.Packages
                .AnyAsync(package => package.TrackingCode == trackingCode, cancellationToken);

            if (packageAlreadyReceived)
            {
                throw new InvalidOperationException(
                    $"Package with tracking code '{trackingCode}' has already been received.");
            }

            var warehouse = await _context.Warehouses
                .FirstOrDefaultAsync(item => item.Id == command.WarehouseId, cancellationToken);

            if (warehouse is null)
            {
                throw new KeyNotFoundException($"Warehouse '{command.WarehouseId}' was not found.");
            }

            var zone = await _context.StorageZones
                .FirstOrDefaultAsync(item => item.Id == command.StorageZoneId, cancellationToken);

            if (zone is null)
            {
                throw new KeyNotFoundException($"Storage zone '{command.StorageZoneId}' was not found.");
            }

            if (zone.WarehouseId != warehouse.Id)
            {
                throw new ArgumentException(
                    "The selected storage zone does not belong to the selected warehouse.");
            }

            if (zone.OccupiedVolumeM3 + command.VolumeM3 > zone.TotalVolumeM3)
            {
                throw new InvalidOperationException("The storage zone does not have enough remaining capacity.");
            }

            if (warehouse.OccupiedVolumeM3 + command.VolumeM3 > warehouse.TotalVolumeM3)
            {
                throw new InvalidOperationException("The warehouse does not have enough remaining capacity.");
            }

            var package = new PackageEntity
            {
                Id = Guid.NewGuid(),
                OrderId = command.OrderId,
                WarehouseId = warehouse.Id,
                StorageZoneId = zone.Id,
                TrackingCode = trackingCode,
                WeightKg = command.WeightKg,
                VolumeM3 = command.VolumeM3,
                IsFragile = command.IsFragile,
                SpecialHandling = NormalizeOptional(command.SpecialHandling),
                Status = PackageStatus.Received,
                ReceivedAt = DateTime.UtcNow
            };

            warehouse.OccupiedVolumeM3 += package.VolumeM3;
            warehouse.UpdatedAt = DateTime.UtcNow;
            zone.OccupiedVolumeM3 += package.VolumeM3;
            zone.UpdatedAt = DateTime.UtcNow;

            _context.Packages.Add(package);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return MapPackage(package);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<PagedResult<PackageResponse>> GetPackagesAsync(
        Guid warehouseId,
        PackageInventoryQuery query,
        CancellationToken cancellationToken = default)
    {
        if (warehouseId == Guid.Empty)
        {
            throw new ArgumentException("Warehouse ID is required.", nameof(warehouseId));
        }

        ValidateInventoryQuery(query);

        var warehouseExists = await _context.Warehouses
            .AnyAsync(warehouse => warehouse.Id == warehouseId, cancellationToken);

        if (!warehouseExists)
        {
            throw new KeyNotFoundException($"Warehouse '{warehouseId}' was not found.");
        }

        IQueryable<PackageEntity> packages = _context.Packages
            .AsNoTracking()
            .Where(package => package.WarehouseId == warehouseId);

        if (query.Status is not null)
        {
            if (!Enum.IsDefined(query.Status.Value))
            {
                throw new ArgumentException("Package status is invalid.", nameof(query.Status));
            }

            packages = packages.Where(package => package.Status == query.Status);
        }

        if (query.StorageZoneId is not null)
        {
            packages = packages.Where(package => package.StorageZoneId == query.StorageZoneId);
        }

        if (!string.IsNullOrWhiteSpace(query.TrackingCode))
        {
            var trackingCode = NormalizeTrackingCode(query.TrackingCode);
            var escapedTrackingCode = EscapeLikeLiteral(trackingCode);
            packages = packages.Where(package =>
                EF.Functions.Like(
                    package.TrackingCode,
                    $"%{escapedTrackingCode}%",
                    "\\"));
        }

        var totalCount = await packages.CountAsync(cancellationToken);
        var items = await packages
            .OrderByDescending(package => package.ReceivedAt)
            .ThenBy(package => package.TrackingCode)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(package => new PackageResponse(
                package.Id,
                package.OrderId,
                package.WarehouseId,
                package.StorageZoneId,
                package.TrackingCode,
                package.WeightKg,
                package.VolumeM3,
                package.IsFragile,
                package.SpecialHandling,
                package.Status.ToString(),
                package.ReceivedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<PackageResponse>(
            items,
            query.Page,
            query.PageSize,
            totalCount);
    }

    public async Task<PackageResponse> MakePackageAvailableAsync(
        Guid packageId,
        CancellationToken cancellationToken = default)
    {
        if (packageId == Guid.Empty)
        {
            throw new ArgumentException("Package ID is required.", nameof(packageId));
        }

        var package = await _context.Packages
            .FirstOrDefaultAsync(item => item.Id == packageId, cancellationToken);

        if (package is null)
        {
            throw new KeyNotFoundException($"Package '{packageId}' was not found.");
        }

        if (package.Status != PackageStatus.Received)
        {
            throw new InvalidOperationException(
                "Only received packages may be made available for dispatch.");
        }

        package.Status = PackageStatus.Available;
        await _context.SaveChangesAsync(cancellationToken);

        return MapPackage(package);
    }

    private static void ValidateWarehouse(CreateWarehouseCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            throw new ArgumentException("Warehouse name is required.", nameof(command.Name));
        }

        if (string.IsNullOrWhiteSpace(command.Location))
        {
            throw new ArgumentException("Warehouse location is required.", nameof(command.Location));
        }

        if (command.TotalVolumeM3 <= 0)
        {
            throw new ArgumentException(
                "Warehouse total volume must be greater than zero.",
                nameof(command.TotalVolumeM3));
        }
    }

    private static void EnsureWarehouseId(Guid warehouseId)
    {
        if (warehouseId == Guid.Empty)
        {
            throw new ArgumentException("Warehouse ID is required.", nameof(warehouseId));
        }
    }

    private static void ValidateStorageZone(CreateStorageZoneCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            throw new ArgumentException("Storage zone name is required.", nameof(command.Name));
        }

        if (string.IsNullOrWhiteSpace(command.Code))
        {
            throw new ArgumentException("Storage zone code is required.", nameof(command.Code));
        }

        if (command.TotalVolumeM3 <= 0)
        {
            throw new ArgumentException(
                "Storage zone total volume must be greater than zero.",
                nameof(command.TotalVolumeM3));
        }
    }

    private static void ValidatePackage(ReceivePackageCommand command)
    {
        if (command.OrderId == Guid.Empty)
        {
            throw new ArgumentException("Order ID is required.", nameof(command.OrderId));
        }

        if (command.WarehouseId == Guid.Empty)
        {
            throw new ArgumentException("Warehouse ID is required.", nameof(command.WarehouseId));
        }

        if (command.StorageZoneId == Guid.Empty)
        {
            throw new ArgumentException("Storage zone ID is required.", nameof(command.StorageZoneId));
        }

        if (string.IsNullOrWhiteSpace(command.TrackingCode))
        {
            throw new ArgumentException("Tracking code is required.", nameof(command.TrackingCode));
        }

        if (command.WeightKg <= 0)
        {
            throw new ArgumentException("Package weight must be greater than zero.", nameof(command.WeightKg));
        }

        if (command.VolumeM3 <= 0)
        {
            throw new ArgumentException("Package volume must be greater than zero.", nameof(command.VolumeM3));
        }
    }

    private static void ValidateInventoryQuery(PackageInventoryQuery query)
    {
        if (query.Page < 1)
        {
            throw new ArgumentException("Page must be at least 1.", nameof(query.Page));
        }

        if (query.PageSize is < 1 or > 100)
        {
            throw new ArgumentException("Page size must be between 1 and 100.", nameof(query.PageSize));
        }
    }

    private static string NormalizeTrackingCode(string trackingCode) =>
        trackingCode.Trim().ToUpperInvariant();

    private static string EscapeLikeLiteral(string value) =>
        value
            .Replace("\\", "\\\\")
            .Replace("%", "\\%")
            .Replace("_", "\\_");

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static WarehouseResponse MapWarehouse(WarehouseEntity warehouse) =>
        new(
            warehouse.Id,
            warehouse.Name,
            warehouse.Location,
            warehouse.TotalVolumeM3,
            warehouse.OccupiedVolumeM3,
            warehouse.CreatedAt,
            warehouse.UpdatedAt);

    private static StorageZoneResponse MapStorageZone(StorageZoneEntity zone) =>
        new(
            zone.Id,
            zone.WarehouseId,
            zone.Name,
            zone.Code,
            zone.TotalVolumeM3,
            zone.OccupiedVolumeM3,
            zone.CreatedAt,
            zone.UpdatedAt);

    private static PackageResponse MapPackage(PackageEntity package) =>
        new(
            package.Id,
            package.OrderId,
            package.WarehouseId,
            package.StorageZoneId,
            package.TrackingCode,
            package.WeightKg,
            package.VolumeM3,
            package.IsFragile,
            package.SpecialHandling,
            package.Status.ToString(),
            package.ReceivedAt);
}
