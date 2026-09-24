namespace LogiFlow.Application.Fleet.DTOs;

public class AssignmentResponse
{
    public Guid Id { get; set; }
    public Guid DriverId { get; set; }
    public Guid VehicleId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public string DriverLicenseNumber { get; set; } = string.Empty;
    public string VehicleRegistrationNumber { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public DateTime? UnassignedAt { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}
