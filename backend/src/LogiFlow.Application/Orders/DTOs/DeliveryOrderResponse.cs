using System;

namespace LogiFlow.Application.Orders.DTOs;

public record DeliveryOrderResponse(
    Guid Id,
    Guid CustomerId,
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
    string? RecipientContact,
    string Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
