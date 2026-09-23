using LogiFlow.Application.Common;
using LogiFlow.Application.Warehouse.DTOs;

namespace LogiFlow.Application.Warehouse;

public interface IWarehouseService
{
    Task<IReadOnlyCollection<WarehouseResponse>> GetWarehousesAsync(
        CancellationToken cancellationToken = default);

    Task<WarehouseResponse> GetWarehouseAsync(
        Guid warehouseId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<StorageZoneResponse>> GetStorageZonesAsync(
        Guid warehouseId,
        CancellationToken cancellationToken = default);

    Task<WarehouseResponse> CreateWarehouseAsync(
        CreateWarehouseCommand command,
        CancellationToken cancellationToken = default);

    Task<StorageZoneResponse> CreateStorageZoneAsync(
        Guid warehouseId,
        CreateStorageZoneCommand command,
        CancellationToken cancellationToken = default);

    Task<PackageResponse> ReceivePackageAsync(
        ReceivePackageCommand command,
        CancellationToken cancellationToken = default);

    Task<PackageResponse> MakePackageAvailableAsync(
        Guid packageId,
        CancellationToken cancellationToken = default);

    Task<PagedResult<PackageResponse>> GetPackagesAsync(
        Guid warehouseId,
        PackageInventoryQuery query,
        CancellationToken cancellationToken = default);
}
