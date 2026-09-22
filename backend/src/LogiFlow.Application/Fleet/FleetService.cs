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
        DriverLicenseNumber = assignment.Driver?.LicenseNumber ?? string.Empty,
        VehicleRegistrationNumber = assignment.Vehicle?.RegistrationNumber ?? string.Empty,
        AssignedAt = assignment.AssignedAt,
        UnassignedAt = assignment.UnassignedAt,
        IsActive = assignment.IsActive,
        Notes = assignment.Notes
    };

    #endregion
}
