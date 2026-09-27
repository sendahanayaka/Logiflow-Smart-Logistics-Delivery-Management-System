using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

public class DutySchedule
{
    public Guid Id { get; set; }
    public Guid DriverId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DutyScheduleStatus Status { get; set; } = DutyScheduleStatus.Scheduled;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Driver Driver { get; set; } = null!;
}
