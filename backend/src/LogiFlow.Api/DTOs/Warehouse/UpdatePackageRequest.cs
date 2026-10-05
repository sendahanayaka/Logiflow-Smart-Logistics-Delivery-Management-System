namespace LogiFlow.Api.DTOs.Warehouse;

public sealed record UpdatePackageRequest(
    Guid StorageZoneId,
    decimal WeightKg,
    decimal VolumeM3,
    bool IsFragile,
    string? SpecialHandling);
