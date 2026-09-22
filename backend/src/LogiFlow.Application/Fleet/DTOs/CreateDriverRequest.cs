using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public class CreateDriverRequest
{
    public Guid? UserId { get; set; }
    public string LicenseNumber { get; set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; set; }
    public string? PhoneNumber { get; set; }
    public DriverStatus Status { get; set; } = DriverStatus.Available;
}
