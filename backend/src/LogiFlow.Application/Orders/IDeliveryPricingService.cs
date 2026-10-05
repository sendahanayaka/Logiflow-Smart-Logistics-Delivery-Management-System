using LogiFlow.Application.Orders.DTOs;
using LogiFlow.Domain.Entities;

namespace LogiFlow.Application.Orders;

public interface IDeliveryPricingService
{
    DeliveryFeeBreakdown CalculateFee(DeliveryOrder order, string handlingRequirement, decimal distanceKm);
}
