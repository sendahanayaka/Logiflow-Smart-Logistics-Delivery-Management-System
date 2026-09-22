using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public class CreateVehicleRequest
{
    public string RegistrationNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public decimal Capacity { get; set; }
    public VehicleStatus Status { get; set; } = VehicleStatus.Available;
}
