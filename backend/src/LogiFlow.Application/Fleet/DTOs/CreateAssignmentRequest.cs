namespace LogiFlow.Application.Fleet.DTOs;

public class CreateAssignmentRequest
{
    public Guid DriverId { get; set; }
    public Guid VehicleId { get; set; }
    public string? Notes { get; set; }
}
