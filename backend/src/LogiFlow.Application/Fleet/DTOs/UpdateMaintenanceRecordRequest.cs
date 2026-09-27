using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public record UpdateMaintenanceRecordRequest(
    DateTime MaintenanceDate,
    string MaintenanceType,
    string? Description = null,
    decimal Cost = 0,
    DateTime? NextMaintenanceDate = null,
    MaintenanceStatus Status = MaintenanceStatus.Scheduled
);
