using LogiFlow.Application.Orders.DTOs;
using LogiFlow.Domain.Entities;

namespace LogiFlow.Application.Orders;

public interface IOrderIntelligenceService
{
    OrderIntelligenceResponse Analyze(DeliveryOrder order);
}
