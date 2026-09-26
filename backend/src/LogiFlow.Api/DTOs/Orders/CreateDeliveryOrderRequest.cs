using System;

namespace LogiFlow.Api.DTOs.Orders;

public record CreateDeliveryOrderRequest(
    string PickupAddress,
    string PickupCity,
    string DeliveryAddress,
    string DeliveryCity,
    string PackageDescription,
    string? SpecialHandling,
    DateTime PreferredPickupDate,
    TimeSpan PreferredPickupTime,
    string Priority,
    decimal WeightKg,
    decimal LengthCm,
    decimal WidthCm,
    decimal HeightCm,
    string? RecipientName,
    string? RecipientContact);
