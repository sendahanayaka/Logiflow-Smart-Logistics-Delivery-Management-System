using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using LogiFlow.Application.Orders.DTOs;

namespace LogiFlow.Application.Orders;

public interface IOrdersService
{
    Task<DeliveryOrderResponse> CreateOrderAsync(CreateDeliveryOrderCommand command, CancellationToken cancellationToken = default);
    Task<IEnumerable<DeliveryOrderResponse>> GetMyOrdersAsync(CancellationToken cancellationToken = default);
    Task<DeliveryOrderResponse> GetOrderByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DeliveryOrderResponse> CancelOrderAsync(Guid id, CancellationToken cancellationToken = default);
}
