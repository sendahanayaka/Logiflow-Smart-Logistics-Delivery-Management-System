using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public class DriverResponse
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string LicenseNumber { get; set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; set; }
    public string? PhoneNumber { get; set; }
    public DriverStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
