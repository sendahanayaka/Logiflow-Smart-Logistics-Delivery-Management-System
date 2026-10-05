namespace LogiFlow.Api.DTOs.Warehouse;

public sealed record UpdateStorageZoneRequest(
    string Name,
    string Code,
    decimal TotalVolumeM3);
