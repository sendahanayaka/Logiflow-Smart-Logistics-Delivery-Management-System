using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Application.Fleet.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace LogiFlow.Application.Fleet;

public class FleetService : IFleetService
{
    private readonly IAppDbContext _context;

    public FleetService(IAppDbContext context)
    {
        _context = context;
    }

    #region Driver Operations

    public async Task<IEnumerable<DriverResponse>> GetAllDriversAsync(CancellationToken cancellationToken = default)
    {
        var drivers = await _context.Drivers
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return drivers.Select(MapToDriverResponse);
    }

    public async Task<DriverResponse?> GetDriverByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var driver = await _context.Drivers
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);

        return driver != null ? MapToDriverResponse(driver) : null;
    }

    public async Task<DriverResponse> CreateDriverAsync(CreateDriverRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCreateDriverRequest(request);

        var licenseNumberUpper = request.LicenseNumber.Trim().ToUpperInvariant();

        var exists = await _context.Drivers
            .AnyAsync(d => d.LicenseNumber.ToUpper() == licenseNumberUpper, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"A driver with license number '{request.LicenseNumber}' already exists.");
        }

        var driver = new Driver
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            FullName = request.FullName.Trim(),
            LicenseNumber = request.LicenseNumber.Trim(),
            LicenseExpiryDate = EnsureUtc(request.LicenseExpiryDate),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Status = request.Status,
            CreatedAt = EnsureUtc(DateTime.UtcNow)
        };

        _context.Drivers.Add(driver);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDriverResponse(driver);
    }

    public async Task<DriverResponse?> UpdateDriverAsync(Guid id, UpdateDriverRequest request, CancellationToken cancellationToken = default)
    {
        ValidateUpdateDriverRequest(request);

        var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
        if (driver == null)
        {
            return null;
        }

        var licenseNumberUpper = request.LicenseNumber.Trim().ToUpperInvariant();

        var exists = await _context.Drivers
            .AnyAsync(d => d.Id != id && d.LicenseNumber.ToUpper() == licenseNumberUpper, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"A driver with license number '{request.LicenseNumber}' already exists.");
        }

        driver.UserId = request.UserId;
        driver.FullName = request.FullName.Trim();
        driver.LicenseNumber = request.LicenseNumber.Trim();
        driver.LicenseExpiryDate = EnsureUtc(request.LicenseExpiryDate);
        driver.PhoneNumber = request.PhoneNumber?.Trim();
        driver.Status = request.Status;
        driver.UpdatedAt = EnsureUtc(DateTime.UtcNow);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDriverResponse(driver);
    }

    public async Task<bool> DeleteDriverAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
        if (driver == null)
        {
            return false;
        }

        _context.Drivers.Remove(driver);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region Vehicle Operations

    public async Task<IEnumerable<VehicleResponse>> GetAllVehiclesAsync(CancellationToken cancellationToken = default)
    {
        var vehicles = await _context.Vehicles
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return vehicles.Select(MapToVehicleResponse);
    }

    public async Task<VehicleResponse?> GetVehicleByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        return vehicle != null ? MapToVehicleResponse(vehicle) : null;
    }

    public async Task<VehicleResponse> CreateVehicleAsync(CreateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCreateVehicleRequest(request);

        var regUpper = request.RegistrationNumber.Trim().ToUpperInvariant();

        var exists = await _context.Vehicles
            .AnyAsync(v => v.RegistrationNumber.ToUpper() == regUpper, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"A vehicle with registration number '{request.RegistrationNumber}' already exists.");
        }

        var vehicle = new Vehicle
        {
            Id = Guid.NewGuid(),
            RegistrationNumber = request.RegistrationNumber.Trim(),
            VehicleType = request.VehicleType.Trim(),
            Make = request.Make.Trim(),
            Model = request.Model.Trim(),
            Capacity = request.Capacity,
            Status = request.Status,
            CreatedAt = EnsureUtc(DateTime.UtcNow)
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToVehicleResponse(vehicle);
    }

    public async Task<VehicleResponse?> UpdateVehicleAsync(Guid id, UpdateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        ValidateUpdateVehicleRequest(request);

        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (vehicle == null)
        {
            return null;
        }

        var regUpper = request.RegistrationNumber.Trim().ToUpperInvariant();

        var exists = await _context.Vehicles
            .AnyAsync(v => v.Id != id && v.RegistrationNumber.ToUpper() == regUpper, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException($"A vehicle with registration number '{request.RegistrationNumber}' already exists.");
        }

        vehicle.RegistrationNumber = request.RegistrationNumber.Trim();
        vehicle.VehicleType = request.VehicleType.Trim();
        vehicle.Make = request.Make.Trim();
        vehicle.Model = request.Model.Trim();
        vehicle.Capacity = request.Capacity;
        vehicle.Status = request.Status;
        vehicle.UpdatedAt = EnsureUtc(DateTime.UtcNow);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToVehicleResponse(vehicle);
    }

    public async Task<bool> DeleteVehicleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (vehicle == null)
        {
            return false;
        }

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    #endregion

    #region Assignment Operations

    public async Task<AssignmentResponse> AssignDriverToVehicleAsync(CreateAssignmentRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.DriverId == Guid.Empty)
        {
            throw new ArgumentException("Driver ID is required.", nameof(request.DriverId));
        }

        if (request.VehicleId == Guid.Empty)
        {
            throw new ArgumentException("Vehicle ID is required.", nameof(request.VehicleId));
        }

        // 1. Driver must exist
        var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == request.DriverId, cancellationToken);
        if (driver == null)
        {
            throw new KeyNotFoundException($"Driver with ID '{request.DriverId}' was not found.");
        }

        // 2. Vehicle must exist
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == request.VehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new KeyNotFoundException($"Vehicle with ID '{request.VehicleId}' was not found.");
        }

        // 3. Driver status MUST be Available
        if (driver.Status != DriverStatus.Available)
        {
            throw new InvalidOperationException($"Driver '{driver.LicenseNumber}' is currently {driver.Status} and cannot be assigned.");
        }

        // 4. Vehicle status MUST be Available
        if (vehicle.Status != VehicleStatus.Available)
        {
            throw new InvalidOperationException($"Vehicle '{vehicle.RegistrationNumber}' is currently {vehicle.Status} and cannot be assigned.");
        }

        // 5. Driver license MUST NOT be expired
        var utcNow = DateTime.UtcNow;
        if (driver.LicenseExpiryDate < utcNow)
        {
            throw new InvalidOperationException($"Driver '{driver.LicenseNumber}' has an expired license (Expired: {driver.LicenseExpiryDate:yyyy-MM-dd}).");
        }

        // 6. Driver MUST NOT already have an active assignment
        var driverHasActive = await _context.AssignmentHistories
            .AnyAsync(a => a.DriverId == request.DriverId && a.IsActive, cancellationToken);
        if (driverHasActive)
        {
            throw new InvalidOperationException($"Driver '{driver.LicenseNumber}' already has an active vehicle assignment.");
        }

        // 7. Vehicle MUST NOT already have an active assignment
        var vehicleHasActive = await _context.AssignmentHistories
            .AnyAsync(a => a.VehicleId == request.VehicleId && a.IsActive, cancellationToken);
        if (vehicleHasActive)
        {
            throw new InvalidOperationException($"Vehicle '{vehicle.RegistrationNumber}' already has an active driver assignment.");
        }

        // 8-10. Build entities and update statuses
        var assignment = new AssignmentHistory
        {
            Id = Guid.NewGuid(),
            DriverId = driver.Id,
            VehicleId = vehicle.Id,
            AssignedAt = EnsureUtc(utcNow),
            UnassignedAt = null,
            IsActive = true,
            Notes = request.Notes?.Trim(),
            Driver = driver,
            Vehicle = vehicle
        };

        driver.Status = DriverStatus.OnDuty;
        driver.UpdatedAt = EnsureUtc(utcNow);

        vehicle.Status = VehicleStatus.InTransit;
        vehicle.UpdatedAt = EnsureUtc(utcNow);

        // 11. Atomic transaction
        if (_context is DbContext dbContext)
        {
            using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            _context.AssignmentHistories.Add(assignment);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        else
        {
            _context.AssignmentHistories.Add(assignment);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return MapToAssignmentResponse(assignment);
    }

    public async Task<AssignmentResponse> EndAssignmentAsync(Guid assignmentId, EndAssignmentRequest? request = null, CancellationToken cancellationToken = default)
    {
        if (assignmentId == Guid.Empty)
        {
            throw new ArgumentException("Assignment ID is required.", nameof(assignmentId));
        }

        // 1-4. Find active assignment with Driver and Vehicle
        var assignment = await _context.AssignmentHistories
            .Include(a => a.Driver)
            .Include(a => a.Vehicle)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            throw new KeyNotFoundException($"Assignment with ID '{assignmentId}' was not found.");
        }

        if (!assignment.IsActive)
        {
            throw new InvalidOperationException($"Assignment '{assignmentId}' is already inactive.");
        }

        var utcNow = DateTime.UtcNow;

        // 5. Update assignment
        assignment.IsActive = false;
        assignment.UnassignedAt = EnsureUtc(utcNow);
        if (request != null && !string.IsNullOrWhiteSpace(request.Notes))
        {
            var newNote = request.Notes.Trim();
            assignment.Notes = string.IsNullOrWhiteSpace(assignment.Notes)
                ? newNote
                : $"{assignment.Notes} | Ended: {newNote}";
        }

        // 6-7. Update Driver & Vehicle statuses to Available
        if (assignment.Driver != null)
        {
            assignment.Driver.Status = DriverStatus.Available;
            assignment.Driver.UpdatedAt = EnsureUtc(utcNow);
        }

        if (assignment.Vehicle != null)
        {
            assignment.Vehicle.Status = VehicleStatus.Available;
            assignment.Vehicle.UpdatedAt = EnsureUtc(utcNow);
        }

        // 8. Atomic transaction
        if (_context is DbContext dbContext)
        {
            using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        else
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return MapToAssignmentResponse(assignment);
    }

    public async Task<IEnumerable<AssignmentResponse>> GetActiveAssignmentsAsync(CancellationToken cancellationToken = default)
    {
        var activeAssignments = await _context.AssignmentHistories
            .AsNoTracking()
            .Include(a => a.Driver)
            .Include(a => a.Vehicle)
            .Where(a => a.IsActive)
            .OrderByDescending(a => a.AssignedAt)
            .ToListAsync(cancellationToken);

        return activeAssignments.Select(MapToAssignmentResponse);
    }

    public async Task<IEnumerable<AssignmentResponse>> GetAssignmentHistoryAsync(CancellationToken cancellationToken = default)
    {
        var allAssignments = await _context.AssignmentHistories
            .AsNoTracking()
            .Include(a => a.Driver)
            .Include(a => a.Vehicle)
            .OrderByDescending(a => a.AssignedAt)
            .ToListAsync(cancellationToken);

        return allAssignments.Select(MapToAssignmentResponse);
    }

    #endregion

    #region Duty Schedule Operations

    public async Task<IEnumerable<DutyScheduleResponse>> GetAllDutySchedulesAsync(CancellationToken cancellationToken = default)
    {
        var schedules = await _context.DutySchedules
            .AsNoTracking()
            .Include(s => s.Driver)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync(cancellationToken);

        return schedules.Select(MapToDutyScheduleResponse);
    }

    public async Task<DutyScheduleResponse?> GetDutyScheduleByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var schedule = await _context.DutySchedules
            .AsNoTracking()
            .Include(s => s.Driver)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        return schedule == null ? null : MapToDutyScheduleResponse(schedule);
    }

    public async Task<IEnumerable<DutyScheduleResponse>> GetDutySchedulesByDriverIdAsync(Guid driverId, CancellationToken cancellationToken = default)
    {
        var driverExists = await _context.Drivers.AnyAsync(d => d.Id == driverId, cancellationToken);
        if (!driverExists)
        {
            throw new KeyNotFoundException($"Driver with ID '{driverId}' was not found.");
        }

        var schedules = await _context.DutySchedules
            .AsNoTracking()
            .Include(s => s.Driver)
            .Where(s => s.DriverId == driverId)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync(cancellationToken);

        return schedules.Select(MapToDutyScheduleResponse);
    }

    public async Task<DutyScheduleResponse> CreateDutyScheduleAsync(CreateDutyScheduleRequest request, CancellationToken cancellationToken = default)
    {
        ValidateDutyScheduleDates(request.StartTime, request.EndTime);

        var utcStart = EnsureUtc(request.StartTime);
        var utcEnd = EnsureUtc(request.EndTime);

        var driver = await _context.Drivers.FindAsync(new object[] { request.DriverId }, cancellationToken);
        if (driver == null)
        {
            throw new KeyNotFoundException($"Driver with ID '{request.DriverId}' was not found.");
        }

        if (driver.Status == DriverStatus.Suspended || driver.Status == DriverStatus.Inactive)
        {
            throw new InvalidOperationException($"Cannot create a duty schedule for driver '{driver.FullName}' because driver status is '{driver.Status}'.");
        }

        await CheckForOverlappingSchedulesAsync(request.DriverId, utcStart, utcEnd, null, cancellationToken);

        var schedule = new DutySchedule
        {
            Id = Guid.NewGuid(),
            DriverId = request.DriverId,
            StartTime = utcStart,
            EndTime = utcEnd,
            Status = request.Status,
            Notes = request.Notes?.Trim(),
            CreatedAt = EnsureUtc(DateTime.UtcNow),
            Driver = driver
        };

        _context.DutySchedules.Add(schedule);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDutyScheduleResponse(schedule);
    }

    public async Task<DutyScheduleResponse?> UpdateDutyScheduleAsync(Guid id, UpdateDutyScheduleRequest request, CancellationToken cancellationToken = default)
    {
        ValidateDutyScheduleDates(request.StartTime, request.EndTime);

        var utcStart = EnsureUtc(request.StartTime);
        var utcEnd = EnsureUtc(request.EndTime);

        var schedule = await _context.DutySchedules
            .Include(s => s.Driver)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

        if (schedule == null)
        {
            return null;
        }

        await CheckForOverlappingSchedulesAsync(schedule.DriverId, utcStart, utcEnd, id, cancellationToken);

        schedule.StartTime = utcStart;
        schedule.EndTime = utcEnd;
        schedule.Status = request.Status;
        schedule.Notes = request.Notes?.Trim();
        schedule.UpdatedAt = EnsureUtc(DateTime.UtcNow);

        await _context.SaveChangesAsync(cancellationToken);

        return MapToDutyScheduleResponse(schedule);
    }

    public async Task<bool> DeleteDutyScheduleAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var schedule = await _context.DutySchedules.FindAsync(new object[] { id }, cancellationToken);
        if (schedule == null)
        {
            return false;
        }

        _context.DutySchedules.Remove(schedule);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<DriverAvailabilityResponse> CheckDriverScheduleAvailabilityAsync(Guid driverId, DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default)
    {
        ValidateDutyScheduleDates(startTime, endTime);

        var utcStart = EnsureUtc(startTime);
        var utcEnd = EnsureUtc(endTime);

        var driver = await _context.Drivers.FindAsync(new object[] { driverId }, cancellationToken);
        if (driver == null)
        {
            throw new KeyNotFoundException($"Driver with ID '{driverId}' was not found.");
        }

        if (driver.Status == DriverStatus.Suspended || driver.Status == DriverStatus.Inactive)
        {
            return new DriverAvailabilityResponse(
                driverId,
                driver.FullName,
                false,
                $"Driver status is currently '{driver.Status}'.",
                utcStart,
                utcEnd,
                null
            );
        }

        var overlappingSchedule = await _context.DutySchedules
            .AsNoTracking()
            .Where(s => s.DriverId == driverId &&
                        s.Status != DutyScheduleStatus.Cancelled &&
                        utcStart < s.EndTime && utcEnd > s.StartTime)
            .FirstOrDefaultAsync(cancellationToken);

        if (overlappingSchedule != null)
        {
            return new DriverAvailabilityResponse(
                driverId,
                driver.FullName,
                false,
                $"Driver has an overlapping duty schedule ({overlappingSchedule.StartTime:yyyy-MM-dd HH:mm} - {overlappingSchedule.EndTime:yyyy-MM-dd HH:mm}).",
                utcStart,
                utcEnd,
                overlappingSchedule.Id
            );
        }

        return new DriverAvailabilityResponse(
            driverId,
            driver.FullName,
            true,
            "Driver is available during the requested period.",
            utcStart,
            utcEnd,
            null
        );
    }

    #endregion


    #region Private Helpers & Validation

    private static DateTime EnsureUtc(DateTime dt)
    {
        if (dt == default) return dt;
        return dt.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            : dt.ToUniversalTime();
    }

    private static void ValidateCreateDriverRequest(CreateDriverRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Driver full name is required.", nameof(request.FullName));
        }

        if (string.IsNullOrWhiteSpace(request.LicenseNumber))
        {
            throw new ArgumentException("Driver license number is required.", nameof(request.LicenseNumber));
        }

        if (request.LicenseExpiryDate == default)
        {
            throw new ArgumentException("Valid license expiry date is required.", nameof(request.LicenseExpiryDate));
        }
    }

    private static void ValidateUpdateDriverRequest(UpdateDriverRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Driver full name is required.", nameof(request.FullName));
        }

        if (string.IsNullOrWhiteSpace(request.LicenseNumber))
        {
            throw new ArgumentException("Driver license number is required.", nameof(request.LicenseNumber));
        }

        if (request.LicenseExpiryDate == default)
        {
            throw new ArgumentException("Valid license expiry date is required.", nameof(request.LicenseExpiryDate));
        }
    }

    private static void ValidateCreateVehicleRequest(CreateVehicleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RegistrationNumber))
        {
            throw new ArgumentException("Vehicle registration number is required.", nameof(request.RegistrationNumber));
        }

        if (string.IsNullOrWhiteSpace(request.VehicleType))
        {
            throw new ArgumentException("Vehicle type is required.", nameof(request.VehicleType));
        }

        if (string.IsNullOrWhiteSpace(request.Make))
        {
            throw new ArgumentException("Vehicle make is required.", nameof(request.Make));
        }

        if (string.IsNullOrWhiteSpace(request.Model))
        {
            throw new ArgumentException("Vehicle model is required.", nameof(request.Model));
        }

        if (request.Capacity <= 0)
        {
            throw new ArgumentException("Vehicle capacity must be greater than zero.", nameof(request.Capacity));
        }
    }

    private static void ValidateUpdateVehicleRequest(UpdateVehicleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RegistrationNumber))
        {
            throw new ArgumentException("Vehicle registration number is required.", nameof(request.RegistrationNumber));
        }

        if (string.IsNullOrWhiteSpace(request.VehicleType))
        {
            throw new ArgumentException("Vehicle type is required.", nameof(request.VehicleType));
        }

        if (string.IsNullOrWhiteSpace(request.Make))
        {
            throw new ArgumentException("Vehicle make is required.", nameof(request.Make));
        }

        if (string.IsNullOrWhiteSpace(request.Model))
        {
            throw new ArgumentException("Vehicle model is required.", nameof(request.Model));
        }

        if (request.Capacity <= 0)
        {
            throw new ArgumentException("Vehicle capacity must be greater than zero.", nameof(request.Capacity));
        }
    }

    private static DriverResponse MapToDriverResponse(Driver driver) => new()
    {
        Id = driver.Id,
        UserId = driver.UserId,
        FullName = driver.FullName,
        LicenseNumber = driver.LicenseNumber,
        LicenseExpiryDate = driver.LicenseExpiryDate,
        PhoneNumber = driver.PhoneNumber,
        Status = driver.Status,
        CreatedAt = driver.CreatedAt,
        UpdatedAt = driver.UpdatedAt
    };

    private static VehicleResponse MapToVehicleResponse(Vehicle vehicle) => new()
    {
        Id = vehicle.Id,
        RegistrationNumber = vehicle.RegistrationNumber,
        VehicleType = vehicle.VehicleType,
        Make = vehicle.Make,
        Model = vehicle.Model,
        Capacity = vehicle.Capacity,
        Status = vehicle.Status,
        CreatedAt = vehicle.CreatedAt,
        UpdatedAt = vehicle.UpdatedAt
    };

    private static AssignmentResponse MapToAssignmentResponse(AssignmentHistory assignment) => new()
    {
        Id = assignment.Id,
        DriverId = assignment.DriverId,
        VehicleId = assignment.VehicleId,
        DriverName = assignment.Driver?.FullName ?? string.Empty,
        DriverLicenseNumber = assignment.Driver?.LicenseNumber ?? string.Empty,
        VehicleRegistrationNumber = assignment.Vehicle?.RegistrationNumber ?? string.Empty,
        AssignedAt = assignment.AssignedAt,
        UnassignedAt = assignment.UnassignedAt,
        IsActive = assignment.IsActive,
        Notes = assignment.Notes
    };

    private static void ValidateDutyScheduleDates(DateTime startTime, DateTime endTime)
    {
        if (startTime == default)
        {
            throw new ArgumentException("Valid start time is required.", nameof(startTime));
        }

        if (endTime == default)
        {
            throw new ArgumentException("Valid end time is required.", nameof(endTime));
        }

        if (startTime >= endTime)
        {
            throw new ArgumentException("StartTime must be strictly before EndTime.", nameof(startTime));
        }
    }

    private async Task CheckForOverlappingSchedulesAsync(Guid driverId, DateTime utcStart, DateTime utcEnd, Guid? excludeScheduleId, CancellationToken cancellationToken)
    {
        var hasOverlap = await _context.DutySchedules
            .AsNoTracking()
            .AnyAsync(s => s.DriverId == driverId &&
                           s.Status != DutyScheduleStatus.Cancelled &&
                           (excludeScheduleId == null || s.Id != excludeScheduleId.Value) &&
                           (utcStart < s.EndTime && utcEnd > s.StartTime), cancellationToken);

        if (hasOverlap)
        {
            throw new InvalidOperationException("Driver has an overlapping duty schedule for the specified date/time range.");
        }
    }

    private static DutyScheduleResponse MapToDutyScheduleResponse(DutySchedule schedule) => new(
        schedule.Id,
        schedule.DriverId,
        schedule.Driver?.FullName ?? string.Empty,
        schedule.StartTime,
        schedule.EndTime,
        schedule.Status,
        schedule.Notes,
        schedule.CreatedAt,
        schedule.UpdatedAt
    );

    #endregion

    #region Maintenance Record Operations

    public async Task<IEnumerable<MaintenanceRecordResponse>> GetAllMaintenanceRecordsAsync(CancellationToken cancellationToken = default)
    {
        var records = await _context.MaintenanceRecords
            .AsNoTracking()
            .Include(m => m.Vehicle)
            .OrderByDescending(m => m.MaintenanceDate)
            .ToListAsync(cancellationToken);

        return records.Select(MapToMaintenanceRecordResponse);
    }

    public async Task<MaintenanceRecordResponse?> GetMaintenanceRecordByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var record = await _context.MaintenanceRecords
            .AsNoTracking()
            .Include(m => m.Vehicle)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        return record != null ? MapToMaintenanceRecordResponse(record) : null;
    }

    public async Task<IEnumerable<MaintenanceRecordResponse>> GetMaintenanceRecordsByVehicleIdAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var vehicleExists = await _context.Vehicles.AnyAsync(v => v.Id == vehicleId, cancellationToken);
        if (!vehicleExists)
        {
            throw new KeyNotFoundException($"Vehicle with ID '{vehicleId}' was not found.");
        }

        var records = await _context.MaintenanceRecords
            .AsNoTracking()
            .Include(m => m.Vehicle)
            .Where(m => m.VehicleId == vehicleId)
            .OrderByDescending(m => m.MaintenanceDate)
            .ToListAsync(cancellationToken);

        return records.Select(MapToMaintenanceRecordResponse);
    }

    public async Task<MaintenanceRecordResponse> CreateMaintenanceRecordAsync(CreateMaintenanceRecordRequest request, CancellationToken cancellationToken = default)
    {
        ValidateCreateMaintenanceRecordRequest(request);

        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == request.VehicleId, cancellationToken);
        if (vehicle == null)
        {
            throw new KeyNotFoundException($"Vehicle with ID '{request.VehicleId}' was not found.");
        }

        var utcMaintenanceDate = EnsureUtc(request.MaintenanceDate);
        var utcNextMaintenanceDate = request.NextMaintenanceDate.HasValue ? EnsureUtc(request.NextMaintenanceDate.Value) : (DateTime?)null;

        var record = new MaintenanceRecord
        {
            Id = Guid.NewGuid(),
            VehicleId = request.VehicleId,
            MaintenanceDate = utcMaintenanceDate,
            MaintenanceType = request.MaintenanceType.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Cost = request.Cost,
            NextMaintenanceDate = utcNextMaintenanceDate,
            Status = request.Status,
            CreatedAt = DateTime.UtcNow
        };

        // Vehicle Status Integration
        if (request.Status == MaintenanceStatus.InProgress)
        {
            if (vehicle.Status != VehicleStatus.InMaintenance)
            {
                vehicle.Status = VehicleStatus.InMaintenance;
                vehicle.UpdatedAt = DateTime.UtcNow;
            }
        }

        _context.MaintenanceRecords.Add(record);
        await _context.SaveChangesAsync(cancellationToken);

        record.Vehicle = vehicle;
        return MapToMaintenanceRecordResponse(record);
    }

    public async Task<MaintenanceRecordResponse?> UpdateMaintenanceRecordAsync(Guid id, UpdateMaintenanceRecordRequest request, CancellationToken cancellationToken = default)
    {
        ValidateUpdateMaintenanceRecordRequest(request);

        var record = await _context.MaintenanceRecords
            .Include(m => m.Vehicle)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);

        if (record == null)
        {
            return null;
        }

        var utcMaintenanceDate = EnsureUtc(request.MaintenanceDate);
        var utcNextMaintenanceDate = request.NextMaintenanceDate.HasValue ? EnsureUtc(request.NextMaintenanceDate.Value) : (DateTime?)null;

        var oldStatus = record.Status;
        record.MaintenanceDate = utcMaintenanceDate;
        record.MaintenanceType = request.MaintenanceType.Trim();
        record.Description = request.Description?.Trim() ?? string.Empty;
        record.Cost = request.Cost;
        record.NextMaintenanceDate = utcNextMaintenanceDate;
        record.Status = request.Status;
        record.UpdatedAt = DateTime.UtcNow;

        // Vehicle Status Integration
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == record.VehicleId, cancellationToken);
        if (vehicle != null)
        {
            if (request.Status == MaintenanceStatus.InProgress && vehicle.Status != VehicleStatus.InMaintenance)
            {
                vehicle.Status = VehicleStatus.InMaintenance;
                vehicle.UpdatedAt = DateTime.UtcNow;
            }
            else if (oldStatus == MaintenanceStatus.InProgress && request.Status != MaintenanceStatus.InProgress && vehicle.Status == VehicleStatus.InMaintenance)
            {
                var hasOtherInProgress = await _context.MaintenanceRecords
                    .AnyAsync(m => m.VehicleId == vehicle.Id && m.Id != record.Id && m.Status == MaintenanceStatus.InProgress, cancellationToken);

                if (!hasOtherInProgress)
                {
                    vehicle.Status = VehicleStatus.Available;
                    vehicle.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return MapToMaintenanceRecordResponse(record);
    }

    public async Task<bool> DeleteMaintenanceRecordAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var record = await _context.MaintenanceRecords.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (record == null)
        {
            return false;
        }

        if (record.Status == MaintenanceStatus.InProgress)
        {
            var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == record.VehicleId, cancellationToken);
            if (vehicle != null && vehicle.Status == VehicleStatus.InMaintenance)
            {
                var hasOtherInProgress = await _context.MaintenanceRecords
                    .AnyAsync(m => m.VehicleId == vehicle.Id && m.Id != record.Id && m.Status == MaintenanceStatus.InProgress, cancellationToken);

                if (!hasOtherInProgress)
                {
                    vehicle.Status = VehicleStatus.Available;
                    vehicle.UpdatedAt = DateTime.UtcNow;
                }
            }
        }

        _context.MaintenanceRecords.Remove(record);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<VehicleMaintenanceStatusResponse> GetVehicleMaintenanceStatusAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Id == vehicleId, cancellationToken);

        if (vehicle == null)
        {
            throw new KeyNotFoundException($"Vehicle with ID '{vehicleId}' was not found.");
        }

        var records = await _context.MaintenanceRecords
            .AsNoTracking()
            .Where(m => m.VehicleId == vehicleId)
            .ToListAsync(cancellationToken);

        bool currentlyInMaintenance = vehicle.Status == VehicleStatus.InMaintenance || records.Any(m => m.Status == MaintenanceStatus.InProgress);

        var latestRecord = records.OrderByDescending(m => m.MaintenanceDate).FirstOrDefault();
        DateTime? latestMaintenanceDate = latestRecord?.MaintenanceDate;

        var nextMaintenanceDateRecord = records
            .Where(m => m.NextMaintenanceDate.HasValue)
            .OrderByDescending(m => m.NextMaintenanceDate)
            .FirstOrDefault();

        DateTime? nextMaintenanceDate = nextMaintenanceDateRecord?.NextMaintenanceDate;

        bool maintenanceDue = currentlyInMaintenance || (nextMaintenanceDate.HasValue && nextMaintenanceDate.Value <= DateTime.UtcNow);

        return new VehicleMaintenanceStatusResponse(
            vehicle.Id,
            currentlyInMaintenance,
            maintenanceDue,
            nextMaintenanceDate,
            latestMaintenanceDate
        );
    }

    private static void ValidateCreateMaintenanceRecordRequest(CreateMaintenanceRecordRequest request)
    {
        if (request.VehicleId == Guid.Empty)
        {
            throw new ArgumentException("Vehicle ID is required.", nameof(request.VehicleId));
        }

        if (request.MaintenanceDate == default)
        {
            throw new ArgumentException("Valid maintenance date is required.", nameof(request.MaintenanceDate));
        }

        if (string.IsNullOrWhiteSpace(request.MaintenanceType))
        {
            throw new ArgumentException("Maintenance type is required.", nameof(request.MaintenanceType));
        }

        if (request.Cost < 0)
        {
            throw new ArgumentException("Cost must not be negative.", nameof(request.Cost));
        }

        if (request.NextMaintenanceDate.HasValue && request.NextMaintenanceDate.Value < request.MaintenanceDate)
        {
            throw new ArgumentException("Next maintenance date cannot be earlier than maintenance date.", nameof(request.NextMaintenanceDate));
        }

        if (!Enum.IsDefined(typeof(MaintenanceStatus), request.Status))
        {
            throw new ArgumentException("Invalid maintenance status value.", nameof(request.Status));
        }
    }

    private static void ValidateUpdateMaintenanceRecordRequest(UpdateMaintenanceRecordRequest request)
    {
        if (request.MaintenanceDate == default)
        {
            throw new ArgumentException("Valid maintenance date is required.", nameof(request.MaintenanceDate));
        }

        if (string.IsNullOrWhiteSpace(request.MaintenanceType))
        {
            throw new ArgumentException("Maintenance type is required.", nameof(request.MaintenanceType));
        }

        if (request.Cost < 0)
        {
            throw new ArgumentException("Cost must not be negative.", nameof(request.Cost));
        }

        if (request.NextMaintenanceDate.HasValue && request.NextMaintenanceDate.Value < request.MaintenanceDate)
        {
            throw new ArgumentException("Next maintenance date cannot be earlier than maintenance date.", nameof(request.NextMaintenanceDate));
        }

        if (!Enum.IsDefined(typeof(MaintenanceStatus), request.Status))
        {
            throw new ArgumentException("Invalid maintenance status value.", nameof(request.Status));
        }
    }

    private static MaintenanceRecordResponse MapToMaintenanceRecordResponse(MaintenanceRecord record) => new(
        record.Id,
        record.VehicleId,
        record.Vehicle?.RegistrationNumber ?? string.Empty,
        record.MaintenanceDate,
        record.MaintenanceType,
        record.Description,
        record.Cost,
        record.NextMaintenanceDate,
        record.Status,
        record.CreatedAt,
        record.UpdatedAt
    );

    #endregion
}
