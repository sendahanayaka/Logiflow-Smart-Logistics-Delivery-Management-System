namespace LogiFlow.Api.DTOs.Warehouse;

public sealed record CreateWarehouseRequest(
    string Name,
    string Location,
    decimal TotalVolumeM3);
