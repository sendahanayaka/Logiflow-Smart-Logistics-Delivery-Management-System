namespace LogiFlow.Api.DTOs.Warehouse;

public sealed record CreateDispatchBatchRequest(
    Guid WarehouseId,
    string VehicleId,
    decimal MaxWeightKg,
    decimal MaxVolumeM3,
    IReadOnlyCollection<Guid> PackageIds);

public sealed record ReplaceDispatchBatchItemsRequest(
    IReadOnlyCollection<Guid> PackageIds);

public sealed record ValidateDispatchCandidateRequest(
    Guid WarehouseId,
    IReadOnlyCollection<Guid>? PackageIds,
    IReadOnlyCollection<Guid>? OrderIds,
    string? VehicleId,
    decimal MaxWeightKg,
    decimal MaxVolumeM3,
    string? DriverId);

public sealed record DispatchCandidateContextRequest(
    Guid WarehouseId,
    IReadOnlyCollection<Guid>? PackageIds,
    string? VehicleId,
    decimal MaxWeightKg,
    decimal MaxVolumeM3);
