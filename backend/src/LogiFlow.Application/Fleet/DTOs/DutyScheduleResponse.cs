using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public record DutyScheduleResponse(
    Guid Id,
    Guid DriverId,
    string DriverName,
    DateTime StartTime,
    DateTime EndTime,
    DutyScheduleStatus Status,
    string? Notes,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
