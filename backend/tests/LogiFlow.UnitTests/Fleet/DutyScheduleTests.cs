using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using LogiFlow.Application.Fleet;
using LogiFlow.Application.Fleet.DTOs;
using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;


namespace LogiFlow.UnitTests.Fleet;

public class DutyScheduleTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateDutySchedule_ValidRequest_CreatesSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver = new Driver { Id = Guid.NewGuid(), FullName = "Test Driver", LicenseNumber = "B12345", LicenseExpiryDate = DateTime.UtcNow.AddYears(1), Status = DriverStatus.Available };
        context.Drivers.Add(driver);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var request = new CreateDutyScheduleRequest(driver.Id, DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(9), DutyScheduleStatus.Scheduled, "Morning Shift");

        // Act
        var response = await service.CreateDutyScheduleAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.Equal(driver.Id, response.DriverId);
        Assert.Equal("Test Driver", response.DriverName);
        Assert.Equal(DutyScheduleStatus.Scheduled, response.Status);
    }

    [Fact]
    public async Task GetDutyScheduleById_ExistingId_ReturnsSchedule()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver = new Driver { Id = Guid.NewGuid(), FullName = "Test Driver", LicenseNumber = "B12345", LicenseExpiryDate = DateTime.UtcNow.AddYears(1) };
        var schedule = new DutySchedule { Id = Guid.NewGuid(), DriverId = driver.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(8), Status = DutyScheduleStatus.Scheduled, Driver = driver };
        context.Drivers.Add(driver);
        context.DutySchedules.Add(schedule);
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act
        var response = await service.GetDutyScheduleByIdAsync(schedule.Id);

        // Assert
        Assert.NotNull(response);
        Assert.Equal(schedule.Id, response!.Id);
    }

    [Fact]
    public async Task UpdateDutySchedule_ValidRequest_UpdatesSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver = new Driver { Id = Guid.NewGuid(), FullName = "Test Driver", LicenseNumber = "B12345", LicenseExpiryDate = DateTime.UtcNow.AddYears(1) };
        var schedule = new DutySchedule { Id = Guid.NewGuid(), DriverId = driver.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(4), Status = DutyScheduleStatus.Scheduled, Driver = driver };
        context.Drivers.Add(driver);
        context.DutySchedules.Add(schedule);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var updateRequest = new UpdateDutyScheduleRequest(DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(6), DutyScheduleStatus.Active, "Updated Shift");

        // Act
        var response = await service.UpdateDutyScheduleAsync(schedule.Id, updateRequest);

        // Assert
        Assert.NotNull(response);
        Assert.Equal(DutyScheduleStatus.Active, response!.Status);
        Assert.Equal("Updated Shift", response.Notes);
    }

    [Fact]
    public async Task DeleteDutySchedule_ExistingId_DeletesSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver = new Driver { Id = Guid.NewGuid(), FullName = "Test Driver", LicenseNumber = "B12345", LicenseExpiryDate = DateTime.UtcNow.AddYears(1) };
        var schedule = new DutySchedule { Id = Guid.NewGuid(), DriverId = driver.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(8), Status = DutyScheduleStatus.Scheduled, Driver = driver };
        context.Drivers.Add(driver);
        context.DutySchedules.Add(schedule);
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act
        var result = await service.DeleteDutyScheduleAsync(schedule.Id);

        // Assert
        Assert.True(result);
        Assert.Null(await context.DutySchedules.FindAsync(schedule.Id));
    }

    [Fact]
    public async Task CreateDutySchedule_DriverDoesNotExist_ThrowsKeyNotFoundException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new FleetService(context);
        var request = new CreateDutyScheduleRequest(Guid.NewGuid(), DateTime.UtcNow, DateTime.UtcNow.AddHours(8));

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.CreateDutyScheduleAsync(request));
    }

    [Fact]
    public async Task CreateDutySchedule_StartTimeGreaterThanOrEqualToEndTime_ThrowsArgumentException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver = new Driver { Id = Guid.NewGuid(), FullName = "Test Driver", LicenseNumber = "B12345", LicenseExpiryDate = DateTime.UtcNow.AddYears(1) };
        context.Drivers.Add(driver);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var request = new CreateDutyScheduleRequest(driver.Id, DateTime.UtcNow.AddHours(10), DateTime.UtcNow.AddHours(5));

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateDutyScheduleAsync(request));
    }

    [Fact]
    public async Task CreateDutySchedule_OverlappingSchedule_ThrowsInvalidOperationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver = new Driver { Id = Guid.NewGuid(), FullName = "Test Driver", LicenseNumber = "B12345", LicenseExpiryDate = DateTime.UtcNow.AddYears(1) };
        var existingSchedule = new DutySchedule { Id = Guid.NewGuid(), DriverId = driver.Id, StartTime = DateTime.UtcNow.AddHours(8), EndTime = DateTime.UtcNow.AddHours(16), Status = DutyScheduleStatus.Scheduled, Driver = driver };
        context.Drivers.Add(driver);
        context.DutySchedules.Add(existingSchedule);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var overlappingRequest = new CreateDutyScheduleRequest(driver.Id, DateTime.UtcNow.AddHours(10), DateTime.UtcNow.AddHours(18));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateDutyScheduleAsync(overlappingRequest));
    }

    [Fact]
    public async Task GetDutySchedulesByDriverId_ReturnsFilteredSchedules()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver1 = new Driver { Id = Guid.NewGuid(), FullName = "Driver 1", LicenseNumber = "B111", LicenseExpiryDate = DateTime.UtcNow.AddYears(1) };
        var driver2 = new Driver { Id = Guid.NewGuid(), FullName = "Driver 2", LicenseNumber = "B222", LicenseExpiryDate = DateTime.UtcNow.AddYears(1) };
        context.Drivers.AddRange(driver1, driver2);

        context.DutySchedules.Add(new DutySchedule { Id = Guid.NewGuid(), DriverId = driver1.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(8), Driver = driver1 });
        context.DutySchedules.Add(new DutySchedule { Id = Guid.NewGuid(), DriverId = driver2.Id, StartTime = DateTime.UtcNow, EndTime = DateTime.UtcNow.AddHours(8), Driver = driver2 });
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act
        var result = await service.GetDutySchedulesByDriverIdAsync(driver1.Id);

        // Assert
        Assert.Single(result);
        Assert.Equal(driver1.Id, result.First().DriverId);
    }

    [Fact]
    public async Task CheckDriverScheduleAvailability_EvaluatesCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver = new Driver { Id = Guid.NewGuid(), FullName = "Test Driver", LicenseNumber = "B12345", LicenseExpiryDate = DateTime.UtcNow.AddYears(1), Status = DriverStatus.Available };
        var schedule = new DutySchedule { Id = Guid.NewGuid(), DriverId = driver.Id, StartTime = DateTime.UtcNow.AddHours(8), EndTime = DateTime.UtcNow.AddHours(16), Status = DutyScheduleStatus.Scheduled, Driver = driver };
        context.Drivers.Add(driver);
        context.DutySchedules.Add(schedule);
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act 1: Free period
        var freeResult = await service.CheckDriverScheduleAvailabilityAsync(driver.Id, DateTime.UtcNow.AddHours(18), DateTime.UtcNow.AddHours(22));
        // Act 2: Overlapping period
        var busyResult = await service.CheckDriverScheduleAvailabilityAsync(driver.Id, DateTime.UtcNow.AddHours(10), DateTime.UtcNow.AddHours(14));

        // Assert
        Assert.True(freeResult.Available);
        Assert.False(busyResult.Available);
        Assert.Equal(schedule.Id, busyResult.ConflictingScheduleId);
    }

    [Fact]
    public async Task CheckDriverScheduleAvailability_DriverSuspended_ReturnsAvailableFalse()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var driver = new Driver { Id = Guid.NewGuid(), FullName = "Suspended Driver", LicenseNumber = "B99999", LicenseExpiryDate = DateTime.UtcNow.AddYears(1), Status = DriverStatus.Suspended };
        context.Drivers.Add(driver);
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act
        var result = await service.CheckDriverScheduleAvailabilityAsync(driver.Id, DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(5));

        // Assert
        Assert.False(result.Available);
        Assert.Contains("Suspended", result.Reason);
    }
}
