using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public record CreateMaintenanceRecordRequest(
    Guid VehicleId,
    DateTime MaintenanceDate,
    string MaintenanceType,
    string? Description = null,
    decimal Cost = 0,
    DateTime? NextMaintenanceDate = null,
    MaintenanceStatus Status = MaintenanceStatus.Scheduled
);
