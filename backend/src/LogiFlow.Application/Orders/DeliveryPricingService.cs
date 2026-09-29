using LogiFlow.Application.Orders.DTOs;
using LogiFlow.Domain.Entities;
using System;

namespace LogiFlow.Application.Orders;

public class DeliveryPricingService : IDeliveryPricingService
{
    public DeliveryFeeBreakdown CalculateFee(DeliveryOrder order, string handlingRequirement, decimal distanceKm)
    {
        decimal baseFee = 300m;
        
        decimal distanceCharge = distanceKm * 50m;
        decimal weightCharge = order.WeightKg * 20m;
        
        var volumeM3 = (order.LengthCm * order.WidthCm * order.HeightCm) / 1000000m;
        decimal volumeCharge = volumeM3 * 500m;
        
        // Map Express to High priority charge (Rs. 250)
        decimal priorityCharge = order.Priority == LogiFlow.Domain.Enums.DeliveryPriority.Express ? 250m : 0m;
        
        decimal handlingCharge = handlingRequirement switch
        {
            "Fragile" => 200m,
            "Temperature Sensitive" => 400m,
            "Oversized" => 500m,
            _ => 0m
        };
        
        decimal total = baseFee + distanceCharge + weightCharge + volumeCharge + priorityCharge + handlingCharge;
        
        return new DeliveryFeeBreakdown(
            Math.Round(baseFee, 2),
            Math.Round(distanceCharge, 2),
            Math.Round(weightCharge, 2),
            Math.Round(volumeCharge, 2),
            Math.Round(priorityCharge, 2),
            Math.Round(handlingCharge, 2),
            Math.Round(total, 2)
        );
    }
}
