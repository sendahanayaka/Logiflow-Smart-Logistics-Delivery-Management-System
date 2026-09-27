using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Fleet.DTOs;

public record MaintenanceRecordResponse(
    Guid Id,
    Guid VehicleId,
    string VehicleRegistrationNumber,
    DateTime MaintenanceDate,
    string MaintenanceType,
    string? Description,
    decimal Cost,
    DateTime? NextMaintenanceDate,
    MaintenanceStatus Status,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
