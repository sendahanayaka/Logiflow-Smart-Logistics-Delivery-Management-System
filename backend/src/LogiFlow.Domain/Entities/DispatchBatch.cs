using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

public class DispatchBatch
{
    public Guid Id { get; set; }
    public Guid WarehouseId { get; set; }
    public string VehicleId { get; set; } = string.Empty;
    public decimal MaxWeightKg { get; set; }
    public decimal MaxVolumeM3 { get; set; }
    public DispatchBatchStatus Status { get; set; } = DispatchBatchStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<DispatchBatchItem> Items { get; set; } = new List<DispatchBatchItem>();
}
