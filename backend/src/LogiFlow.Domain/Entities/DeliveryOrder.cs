using System;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

public class DeliveryOrder
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    public string PickupAddress { get; set; } = string.Empty;
    public string PickupCity { get; set; } = string.Empty;

    public string DeliveryAddress { get; set; } = string.Empty;
    public string DeliveryCity { get; set; } = string.Empty;

    public DateTime PreferredPickupDate { get; set; }
    public TimeSpan PreferredPickupTime { get; set; }

    public DeliveryPriority Priority { get; set; } = DeliveryPriority.Standard;

    public string PackageDescription { get; set; } = string.Empty;
    public decimal WeightKg { get; set; }
    public decimal LengthCm { get; set; }
    public decimal WidthCm { get; set; }
    public decimal HeightCm { get; set; }
    public string? SpecialHandling { get; set; }

    public string? RecipientName { get; set; }
    public string? RecipientContact { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
