using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public record CreateDutyScheduleRequest(
    Guid DriverId,
    DateTime StartTime,
    DateTime EndTime,
    DutyScheduleStatus Status = DutyScheduleStatus.Scheduled,
    string? Notes = null
);
