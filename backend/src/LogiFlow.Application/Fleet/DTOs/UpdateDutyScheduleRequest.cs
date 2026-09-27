using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public record UpdateDutyScheduleRequest(
    DateTime StartTime,
    DateTime EndTime,
    DutyScheduleStatus Status,
    string? Notes = null
);
