namespace LogiFlow.Domain.Entities;

public class StorageZone
{
    public Guid Id { get; set; }
    public Guid WarehouseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public decimal TotalVolumeM3 { get; set; }
    public decimal OccupiedVolumeM3 { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Warehouse Warehouse { get; set; } = null!;
    public ICollection<Package> Packages { get; set; } = new List<Package>();
}
