namespace LogiFlow.Application.Fleet.DTOs;

public record DriverAvailabilityResponse(
    Guid DriverId,
    string DriverName,
    bool Available,
    string Reason,
    DateTime RequestedStartTime,
    DateTime RequestedEndTime,
    Guid? ConflictingScheduleId = null
);
