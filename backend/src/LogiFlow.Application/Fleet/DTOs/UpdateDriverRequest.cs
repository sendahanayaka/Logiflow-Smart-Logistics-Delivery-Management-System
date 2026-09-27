using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public class UpdateDriverRequest
{
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; set; }
    public string? PhoneNumber { get; set; }
    public DriverStatus Status { get; set; }
}
