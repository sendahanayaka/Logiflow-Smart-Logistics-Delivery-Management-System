using LogiFlow.Application.Warehouse.DTOs;

namespace LogiFlow.Application.Warehouse;

public interface IDispatchBatchService
{
    Task<DispatchBatchCreationResponse> CreateBatchAsync(
        CreateDispatchBatchCommand command,
        CancellationToken cancellationToken = default);

    Task<DispatchBatchCreationResponse> ReplaceItemsAsync(
        Guid batchId,
        ReplaceDispatchBatchItemsCommand command,
        CancellationToken cancellationToken = default);

    Task<DispatchBatchValidationResponse> GetValidationAsync(
        Guid batchId,
        CancellationToken cancellationToken = default);

    Task<WarehouseThroughputResponse> GetThroughputAsync(
        Guid warehouseId,
        WarehouseThroughputQuery query,
        CancellationToken cancellationToken = default);
}
