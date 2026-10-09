using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LogiFlow.Application.Fleet;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;

namespace LogiFlow.UnitTests.Fleet;

/// <summary>
/// [S4] Driver self-service end-of-assignment (BE-EA): a driver who finishes a run
/// ends their own active assignment, which must free both the driver and the vehicle.
/// </summary>
public sealed class DriverEndAssignmentTests
{
    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            // EndAssignmentAsync opens a transaction; the in-memory provider ignores
            // transactions, so silence that warning (it would otherwise throw).
            .UseInMemoryDatabase($"end-assignment-{Guid.NewGuid():N}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options);

    // BE-EA-01 (normal): ending the signed-in driver's active assignment frees the
    // driver AND the vehicle, and marks the assignment inactive.
    [Fact]
    public async Task EndActiveAssignmentForUser_FreesDriverAndVehicle()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var driver = new Driver { Id = Guid.NewGuid(), UserId = userId, FullName = "Kamal Perera", LicenseNumber = "B1234567", LicenseExpiryDate = DateTime.UtcNow.AddYears(2), Status = DriverStatus.OnDelivery };
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP-CAB-1234", VehicleType = "Van", Capacity = 1000m, Status = VehicleStatus.InTransit };
        var assignment = new AssignmentHistory { Id = Guid.NewGuid(), DriverId = driver.Id, VehicleId = vehicle.Id, IsActive = true, Driver = driver, Vehicle = vehicle };
        context.Drivers.Add(driver);
        context.Vehicles.Add(vehicle);
        context.AssignmentHistories.Add(assignment);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var result = await service.EndActiveAssignmentForUserAsync(userId);

        Assert.False(result.IsActive);
        var freedDriver = await context.Drivers.SingleAsync(d => d.Id == driver.Id);
        var freedVehicle = await context.Vehicles.SingleAsync(v => v.Id == vehicle.Id);
        var endedAssignment = await context.AssignmentHistories.SingleAsync(a => a.Id == assignment.Id);
        Assert.Equal(DriverStatus.Available, freedDriver.Status);
        Assert.Equal(VehicleStatus.Available, freedVehicle.Status);
        Assert.False(endedAssignment.IsActive);
        Assert.NotNull(endedAssignment.UnassignedAt);
    }

    // BE-EA-02 (failure): a driver with no active assignment cannot end one.
    [Fact]
    public async Task EndActiveAssignmentForUser_NoActiveAssignment_Throws()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        context.Drivers.Add(new Driver { Id = Guid.NewGuid(), UserId = userId, FullName = "Nimal Silva", LicenseNumber = "C9876543", LicenseExpiryDate = DateTime.UtcNow.AddYears(2), Status = DriverStatus.Available });
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.EndActiveAssignmentForUserAsync(userId));
    }

    // BE-EA-03 (failure): a user account with no linked driver profile is rejected.
    [Fact]
    public async Task EndActiveAssignmentForUser_NoDriverProfile_Throws()
    {
        using var context = CreateContext();
        var service = new FleetService(context);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.EndActiveAssignmentForUserAsync(Guid.NewGuid()));
    }
}
