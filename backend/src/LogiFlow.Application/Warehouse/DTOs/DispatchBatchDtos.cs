namespace LogiFlow.Application.Warehouse.DTOs;

public sealed record VehicleCapacityContext(
    string VehicleId,
    decimal MaxWeightKg,
    decimal MaxVolumeM3);

public sealed record CreateDispatchBatchCommand(
    Guid WarehouseId,
    VehicleCapacityContext VehicleCapacity,
    IReadOnlyCollection<Guid> PackageIds);

public sealed record ReplaceDispatchBatchItemsCommand(
    IReadOnlyCollection<Guid> PackageIds);

public sealed record WarehouseThroughputQuery(
    DateTime FromUtc,
    DateTime ToUtc);

public sealed record DispatchBatchItemResponse(
    Guid PackageId,
    string TrackingCode,
    int LoadSequence,
    decimal WeightKg,
    decimal VolumeM3,
    bool IsFragile);

public sealed record DispatchBatchResponse(
    Guid Id,
    Guid WarehouseId,
    string VehicleId,
    decimal MaxWeightKg,
    decimal MaxVolumeM3,
    decimal TotalWeightKg,
    decimal TotalVolumeM3,
    string Status,
    IReadOnlyCollection<DispatchBatchItemResponse> Items,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record DispatchBatchValidationResponse(
    Guid BatchId,
    Guid WarehouseId,
    int PackageCount,
    decimal TotalWeightKg,
    decimal TotalVolumeM3,
    bool CapacityValid,
    bool PackageAvailabilityValid,
    bool WarehouseConsistent,
    bool FragileLoadOrderValid,
    string Result,
    IReadOnlyCollection<string> Issues);

public sealed record WarehouseThroughputResponse(
    Guid WarehouseId,
    DateTime FromUtc,
    DateTime ToUtc,
    int ReceivedPackageCount,
    decimal ReceivedWeightKg,
    decimal ReceivedVolumeM3,
    int ReservedPackageCount,
    int DispatchedPackageCount);
