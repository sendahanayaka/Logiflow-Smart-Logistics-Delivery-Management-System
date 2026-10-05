using LogiFlow.Application.Orders.DTOs;
using LogiFlow.Domain.Entities;
using System;
using System.Collections.Generic;

namespace LogiFlow.Application.Orders;

public class OrderIntelligenceService : IOrderIntelligenceService
{
    public OrderIntelligenceResponse Analyze(DeliveryOrder order)
    {
        var volumeM3 = (order.LengthCm * order.WidthCm * order.HeightCm) / 1000000m;
        
        string weightClass = order.WeightKg switch
        {
            < 5 => "Light",
            < 20 => "Medium",
            < 50 => "Heavy",
            _ => "Very Heavy"
        };
        
        string handlingReq = "None";
        if (!string.IsNullOrWhiteSpace(order.SpecialHandling))
        {
            var lower = order.SpecialHandling.ToLower();
            if (lower.Contains("fragile")) handlingReq = "Fragile";
            else if (lower.Contains("temperature") || lower.Contains("temp") || lower.Contains("cold")) handlingReq = "Temperature Sensitive";
            else if (lower.Contains("oversize") || lower.Contains("large")) handlingReq = "Oversized";
            else handlingReq = order.SpecialHandling.Trim();
        }
        else if (!string.IsNullOrWhiteSpace(order.PackageDescription))
        {
            var lower = order.PackageDescription.ToLower();
            if (lower.Contains("fragile") || lower.Contains("glass")) handlingReq = "Fragile";
            else if (lower.Contains("temperature") || lower.Contains("temp") || lower.Contains("cold")) handlingReq = "Temperature Sensitive";
        }
        
        var recommendedPriority = order.Priority.ToString();
        
        var risks = new List<string>();
        if (string.IsNullOrWhiteSpace(order.PickupAddress)) risks.Add("Pickup address is missing.");
        if (string.IsNullOrWhiteSpace(order.PickupCity)) risks.Add("Pickup city is missing.");
        if (string.IsNullOrWhiteSpace(order.DeliveryAddress)) risks.Add("Delivery address is missing.");
        if (string.IsNullOrWhiteSpace(order.DeliveryCity)) risks.Add("Delivery city is missing.");
        
        if (order.WeightKg <= 0) risks.Add("Package weight must be greater than zero.");
        if (order.LengthCm <= 0 || order.WidthCm <= 0 || order.HeightCm <= 0) risks.Add("Package dimensions must be greater than zero.");
        if (order.PreferredPickupDate == default) risks.Add("Preferred pickup date is missing.");
        
        if (handlingReq != "None" && handlingReq != "Fragile" && handlingReq != "Temperature Sensitive" && handlingReq != "Oversized")
        {
            risks.Add("Special handling information may require manual review.");
        }
        
        return new OrderIntelligenceResponse(
            volumeM3,
            weightClass,
            handlingReq,
            recommendedPriority,
            risks
        );
    }
}
