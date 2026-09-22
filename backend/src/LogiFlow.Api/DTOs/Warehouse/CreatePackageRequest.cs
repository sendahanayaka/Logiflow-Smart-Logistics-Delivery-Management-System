namespace LogiFlow.Api.DTOs.Warehouse;

public sealed record CreatePackageRequest(
    Guid OrderId,
    Guid WarehouseId,
    Guid StorageZoneId,
    string TrackingCode,
    decimal WeightKg,
    decimal VolumeM3,
    bool IsFragile,
    string? SpecialHandling);
