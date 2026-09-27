namespace LogiFlow.Api.DTOs.Warehouse;

public sealed record CreateStorageZoneRequest(
    string Name,
    string Code,
    decimal TotalVolumeM3);
