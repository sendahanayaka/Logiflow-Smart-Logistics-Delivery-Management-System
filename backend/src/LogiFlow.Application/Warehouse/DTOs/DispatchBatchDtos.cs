using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Warehouse.DTOs;

public sealed record VehicleCapacityContext(
    string VehicleId,
    decimal MaxWeightKg,
    decimal MaxVolumeM3);

public sealed record BatchingCandidate(
    Guid PackageId,
    Guid WarehouseId,
    string StorageZoneCode,
    string TrackingCode,
    decimal WeightKg,
    decimal VolumeM3,
    bool IsFragile,
    PackageStatus Status);

public sealed record BatchingPlanItem(
    Guid PackageId,
    string TrackingCode,
    string StorageZoneCode,
    decimal WeightKg,
    decimal VolumeM3,
    bool IsFragile,
    decimal NormalizedSize,
    int PlacementSequence,
    int LoadSequence);

public sealed record BatchingPlan(
    string Result,
    IReadOnlyCollection<BatchingPlanItem> Items,
    decimal TotalWeightKg,
    decimal TotalVolumeM3,
    IReadOnlyCollection<string> Issues)
{
    public bool IsPass => Result == "PASS";

    public static BatchingPlan Pass(
        IReadOnlyCollection<BatchingPlanItem> items,
        decimal totalWeightKg,
        decimal totalVolumeM3) =>
        new("PASS", items, totalWeightKg, totalVolumeM3, Array.Empty<string>());

    public static BatchingPlan Revise(
        IReadOnlyCollection<string> issues,
        decimal totalWeightKg = 0,
        decimal totalVolumeM3 = 0) =>
        new("REVISE", Array.Empty<BatchingPlanItem>(), totalWeightKg, totalVolumeM3, issues);
}

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

public sealed record DispatchBatchCreationResponse(
    string Result,
    DispatchBatchResponse? Batch,
    IReadOnlyCollection<string> Issues);

public sealed record DispatchBatchValidationResponse(
    Guid BatchId,
    Guid WarehouseId,
    int PackageCount,
    decimal TotalWeightKg,
    decimal TotalVolumeM3,
    bool WeightCapacityValid,
    bool VolumeCapacityValid,
    bool PackageAvailabilityValid,
    bool WarehouseConsistent,
    bool FragileLoadOrderValid,
    string Result,
    IReadOnlyCollection<string> Issues);

public sealed record DispatchBatchValidationPackageContextResponse(
    Guid PackageId,
    Guid WarehouseId,
    string TrackingCode,
    string Status,
    decimal WeightKg,
    decimal VolumeM3,
    bool IsFragile,
    int LoadSequence);

public sealed record DispatchBatchValidationContextResponse(
    Guid BatchId,
    Guid WarehouseId,
    string VehicleId,
    string BatchStatus,
    decimal MaxWeightKg,
    decimal MaxVolumeM3,
    decimal TotalWeightKg,
    decimal TotalVolumeM3,
    IReadOnlyCollection<DispatchBatchValidationPackageContextResponse> Packages);

public sealed record WarehouseThroughputResponse(
    Guid WarehouseId,
    DateTime FromUtc,
    DateTime ToUtc,
    int ReceivedPackageCount,
    decimal ReceivedWeightKg,
    decimal ReceivedVolumeM3,
    int ReservedPackageCount,
    int DispatchedPackageCount,
    int CreatedDispatchBatchCount,
    int BatchedPackageCount);
