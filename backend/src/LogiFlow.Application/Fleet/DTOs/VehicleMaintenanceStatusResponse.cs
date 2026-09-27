namespace LogiFlow.Application.Fleet.DTOs;

public record VehicleMaintenanceStatusResponse(
    Guid VehicleId,
    bool CurrentlyInMaintenance,
    bool MaintenanceDue,
    DateTime? NextMaintenanceDate,
    DateTime? LatestMaintenanceDate
);
