using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

public class MaintenanceRecord
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public DateTime MaintenanceDate { get; set; }
    public string MaintenanceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public DateTime? NextMaintenanceDate { get; set; }
    public MaintenanceStatus Status { get; set; } = MaintenanceStatus.Scheduled;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

