using System;

namespace LogiFlow.Application.Orders.DTOs;

public record DeliveryFeeBreakdown(
    decimal BaseFee,
    decimal DistanceCharge,
    decimal WeightCharge,
    decimal VolumeCharge,
    decimal PriorityCharge,
    decimal HandlingCharge,
    decimal TotalDeliveryFee
);
