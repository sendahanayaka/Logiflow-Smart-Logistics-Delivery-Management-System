using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

public class Package
{
    public Guid Id { get; set; }

    // TODO(S1): Add a DeliveryOrder navigation/FK only after S1 publishes its final contract.
    public Guid OrderId { get; set; }

    public Guid WarehouseId { get; set; }
    public Guid StorageZoneId { get; set; }
    public string TrackingCode { get; set; } = string.Empty;
    public decimal WeightKg { get; set; }
    public decimal VolumeM3 { get; set; }
    public bool IsFragile { get; set; }
    public string? SpecialHandling { get; set; }
    public PackageStatus Status { get; set; } = PackageStatus.Received;
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;

    public Warehouse Warehouse { get; set; } = null!;
    public StorageZone StorageZone { get; set; } = null!;
}
