using LogiFlow.Application.Common;
using LogiFlow.Application.Warehouse.DTOs;

namespace LogiFlow.Application.Warehouse;

public interface IWarehouseService
{
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

    Task<PagedResult<PackageResponse>> GetPackagesAsync(
        Guid warehouseId,
        PackageInventoryQuery query,
        CancellationToken cancellationToken = default);
}
