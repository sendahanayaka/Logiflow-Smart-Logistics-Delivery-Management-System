using LogiFlow.Application.Fleet.DTOs;

namespace LogiFlow.Application.Fleet;

public interface IFleetService
{
    // Driver operations
    Task<IEnumerable<DriverResponse>> GetAllDriversAsync(CancellationToken cancellationToken = default);
    Task<DriverResponse?> GetDriverByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<DriverResponse> CreateDriverAsync(CreateDriverRequest request, CancellationToken cancellationToken = default);
    Task<DriverResponse?> UpdateDriverAsync(Guid id, UpdateDriverRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteDriverAsync(Guid id, CancellationToken cancellationToken = default);

    // Vehicle operations
    Task<IEnumerable<VehicleResponse>> GetAllVehiclesAsync(CancellationToken cancellationToken = default);
    Task<VehicleResponse?> GetVehicleByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<VehicleResponse> CreateVehicleAsync(CreateVehicleRequest request, CancellationToken cancellationToken = default);
    Task<VehicleResponse?> UpdateVehicleAsync(Guid id, UpdateVehicleRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteVehicleAsync(Guid id, CancellationToken cancellationToken = default);

    // Assignment operations
    Task<AssignmentResponse> AssignDriverToVehicleAsync(CreateAssignmentRequest request, CancellationToken cancellationToken = default);
    Task<AssignmentResponse> EndAssignmentAsync(Guid assignmentId, EndAssignmentRequest? request = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<AssignmentResponse>> GetActiveAssignmentsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<AssignmentResponse>> GetAssignmentHistoryAsync(CancellationToken cancellationToken = default);

    // Duty Schedule operations
    Task<IEnumerable<DutyScheduleResponse>> GetAllDutySchedulesAsync(CancellationToken cancellationToken = default);
    Task<DutyScheduleResponse?> GetDutyScheduleByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<DutyScheduleResponse>> GetDutySchedulesByDriverIdAsync(Guid driverId, CancellationToken cancellationToken = default);
    Task<DutyScheduleResponse> CreateDutyScheduleAsync(CreateDutyScheduleRequest request, CancellationToken cancellationToken = default);
    Task<DutyScheduleResponse?> UpdateDutyScheduleAsync(Guid id, UpdateDutyScheduleRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteDutyScheduleAsync(Guid id, CancellationToken cancellationToken = default);

    // Business-Specific Operation
    Task<DriverAvailabilityResponse> CheckDriverScheduleAvailabilityAsync(Guid driverId, DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default);

    // Maintenance Record operations
    Task<IEnumerable<MaintenanceRecordResponse>> GetAllMaintenanceRecordsAsync(CancellationToken cancellationToken = default);
    Task<MaintenanceRecordResponse?> GetMaintenanceRecordByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<MaintenanceRecordResponse>> GetMaintenanceRecordsByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default);
    Task<MaintenanceRecordResponse> CreateMaintenanceRecordAsync(CreateMaintenanceRecordRequest request, CancellationToken cancellationToken = default);
    Task<MaintenanceRecordResponse?> UpdateMaintenanceRecordAsync(Guid id, UpdateMaintenanceRecordRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteMaintenanceRecordAsync(Guid id, CancellationToken cancellationToken = default);

    // Maintenance Business-Specific Operation
    Task<VehicleMaintenanceStatusResponse> GetVehicleMaintenanceStatusAsync(Guid vehicleId, CancellationToken cancellationToken = default);
}


