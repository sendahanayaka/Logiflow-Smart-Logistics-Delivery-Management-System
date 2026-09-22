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
}
