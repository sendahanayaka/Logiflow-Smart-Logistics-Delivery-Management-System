namespace LogiFlow.Api.DTOs.Warehouse;

public sealed record CreateDispatchBatchRequest(
    Guid WarehouseId,
    string VehicleId,
    decimal MaxWeightKg,
    decimal MaxVolumeM3,
    IReadOnlyCollection<Guid> PackageIds);

public sealed record ReplaceDispatchBatchItemsRequest(
    IReadOnlyCollection<Guid> PackageIds);
