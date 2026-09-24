using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

public class Driver
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public DateTime LicenseExpiryDate { get; set; }
    public string? PhoneNumber { get; set; }
    public DriverStatus Status { get; set; } = DriverStatus.Available;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
