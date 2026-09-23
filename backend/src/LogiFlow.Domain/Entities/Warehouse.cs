namespace LogiFlow.Domain.Entities;

public class Warehouse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal TotalVolumeM3 { get; set; }
    public decimal OccupiedVolumeM3 { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<StorageZone> StorageZones { get; set; } = new List<StorageZone>();
    public ICollection<Package> Packages { get; set; } = new List<Package>();
    public ICollection<DispatchBatch> DispatchBatches { get; set; } = new List<DispatchBatch>();
}
