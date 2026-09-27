namespace LogiFlow.Domain.Entities;

public class AssignmentHistory
{
    public Guid Id { get; set; }
    public Guid DriverId { get; set; }
    public Guid VehicleId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UnassignedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public Driver Driver { get; set; } = null!;
    public Vehicle Vehicle { get; set; } = null!;
}
