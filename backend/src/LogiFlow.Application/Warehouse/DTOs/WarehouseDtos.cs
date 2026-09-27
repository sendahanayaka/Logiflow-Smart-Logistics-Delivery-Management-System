using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Warehouse.DTOs;

public sealed record CreateWarehouseCommand(
    string Name,
    string Location,
    decimal TotalVolumeM3);

public sealed record CreateStorageZoneCommand(
    string Name,
    string Code,
    decimal TotalVolumeM3);

public sealed record ReceivePackageCommand(
    Guid OrderId,
    Guid WarehouseId,
    Guid StorageZoneId,
    string TrackingCode,
    decimal WeightKg,
    decimal VolumeM3,
    bool IsFragile,
    string? SpecialHandling);

public sealed record PackageInventoryQuery(
    int Page,
    int PageSize,
    PackageStatus? Status,
    Guid? StorageZoneId,
    string? TrackingCode);

public sealed record WarehouseResponse(
    Guid Id,
    string Name,
    string Location,
    decimal TotalVolumeM3,
    decimal OccupiedVolumeM3,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record StorageZoneResponse(
    Guid Id,
    Guid WarehouseId,
    string Name,
    string Code,
    decimal TotalVolumeM3,
    decimal OccupiedVolumeM3,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record PackageResponse(
    Guid Id,
    Guid OrderId,
    Guid WarehouseId,
    Guid StorageZoneId,
    string TrackingCode,
    decimal WeightKg,
    decimal VolumeM3,
    bool IsFragile,
    string? SpecialHandling,
    string Status,
    DateTime ReceivedAt);
