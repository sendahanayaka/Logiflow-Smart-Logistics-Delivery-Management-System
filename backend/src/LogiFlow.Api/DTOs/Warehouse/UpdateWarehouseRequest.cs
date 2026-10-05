namespace LogiFlow.Api.DTOs.Warehouse;

public sealed record UpdateWarehouseRequest(
    string Name,
    string Location,
    decimal TotalVolumeM3);
