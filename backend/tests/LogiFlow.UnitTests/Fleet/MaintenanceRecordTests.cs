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

public class MaintenanceRecordTests
{
    private static AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateMaintenanceRecord_ValidRequest_CreatesSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1001", VehicleType = "Van", Make = "Toyota", Model = "HiAce", Capacity = 1500, Status = VehicleStatus.Available };
        context.Vehicles.Add(vehicle);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var request = new CreateMaintenanceRecordRequest(
            vehicle.Id,
            DateTime.UtcNow,
            "Oil Change",
            "Routine engine oil and filter replacement",
            150.00m,
            DateTime.UtcNow.AddMonths(6),
            MaintenanceStatus.Scheduled
        );

        // Act
        var response = await service.CreateMaintenanceRecordAsync(request);

        // Assert
        Assert.NotNull(response);
        Assert.Equal(vehicle.Id, response.VehicleId);
        Assert.Equal("WP CAB-1001", response.VehicleRegistrationNumber);
        Assert.Equal("Oil Change", response.MaintenanceType);
        Assert.Equal(150.00m, response.Cost);
        Assert.Equal(MaintenanceStatus.Scheduled, response.Status);
    }

    [Fact]
    public async Task GetMaintenanceRecordById_ExistingId_ReturnsRecord()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1002", VehicleType = "Truck", Make = "Isuzu", Model = "Elf", Capacity = 3000, Status = VehicleStatus.Available };
        var record = new MaintenanceRecord
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicle.Id,
            MaintenanceDate = DateTime.UtcNow,
            MaintenanceType = "Brake Service",
            Description = "Front brake pad replacement",
            Cost = 250.00m,
            Status = MaintenanceStatus.Completed,
            Vehicle = vehicle
        };
        context.Vehicles.Add(vehicle);
        context.MaintenanceRecords.Add(record);
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act
        var response = await service.GetMaintenanceRecordByIdAsync(record.Id);

        // Assert
        Assert.NotNull(response);
        Assert.Equal(record.Id, response!.Id);
        Assert.Equal("Brake Service", response.MaintenanceType);
        Assert.Equal(MaintenanceStatus.Completed, response.Status);
    }

    [Fact]
    public async Task UpdateMaintenanceRecord_ValidRequest_UpdatesSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1003", VehicleType = "Van", Make = "Nissan", Model = "Caravan", Capacity = 1200, Status = VehicleStatus.Available };
        var record = new MaintenanceRecord
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicle.Id,
            MaintenanceDate = DateTime.UtcNow,
            MaintenanceType = "Tire Inspection",
            Cost = 50.00m,
            Status = MaintenanceStatus.Scheduled,
            Vehicle = vehicle
        };
        context.Vehicles.Add(vehicle);
        context.MaintenanceRecords.Add(record);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var updateRequest = new UpdateMaintenanceRecordRequest(
            DateTime.UtcNow,
            "Tire Replacement",
            "Replaced all 4 tires with all-season set",
            400.00m,
            DateTime.UtcNow.AddYears(1),
            MaintenanceStatus.Completed
        );

        // Act
        var response = await service.UpdateMaintenanceRecordAsync(record.Id, updateRequest);

        // Assert
        Assert.NotNull(response);
        Assert.Equal("Tire Replacement", response!.MaintenanceType);
        Assert.Equal(400.00m, response.Cost);
        Assert.Equal(MaintenanceStatus.Completed, response.Status);
    }

    [Fact]
    public async Task DeleteMaintenanceRecord_ExistingId_DeletesSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1004", VehicleType = "Van", Make = "Toyota", Model = "TownAce", Capacity = 800, Status = VehicleStatus.Available };
        var record = new MaintenanceRecord
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicle.Id,
            MaintenanceDate = DateTime.UtcNow,
            MaintenanceType = "Battery Check",
            Cost = 30.00m,
            Status = MaintenanceStatus.Completed,
            Vehicle = vehicle
        };
        context.Vehicles.Add(vehicle);
        context.MaintenanceRecords.Add(record);
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act
        var result = await service.DeleteMaintenanceRecordAsync(record.Id);

        // Assert
        Assert.True(result);
        Assert.Null(await context.MaintenanceRecords.FindAsync(record.Id));
    }

    [Fact]
    public async Task CreateMaintenanceRecord_VehicleDoesNotExist_ThrowsKeyNotFoundException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var service = new FleetService(context);
        var request = new CreateMaintenanceRecordRequest(
            Guid.NewGuid(),
            DateTime.UtcNow,
            "Transmission Repair",
            Cost: 500.00m
        );

        // Act & Assert
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.CreateMaintenanceRecordAsync(request));
    }

    [Fact]
    public async Task CreateMaintenanceRecord_NegativeCost_ThrowsArgumentException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1005", VehicleType = "Van", Make = "Toyota", Model = "HiAce", Capacity = 1500, Status = VehicleStatus.Available };
        context.Vehicles.Add(vehicle);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var request = new CreateMaintenanceRecordRequest(
            vehicle.Id,
            DateTime.UtcNow,
            "Oil Change",
            Cost: -50.00m
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateMaintenanceRecordAsync(request));
        Assert.Contains("Cost must not be negative", ex.Message);
    }

    [Fact]
    public async Task CreateMaintenanceRecord_InvalidMaintenanceDate_ThrowsArgumentException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1006", VehicleType = "Van", Make = "Toyota", Model = "HiAce", Capacity = 1500, Status = VehicleStatus.Available };
        context.Vehicles.Add(vehicle);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var request = new CreateMaintenanceRecordRequest(
            vehicle.Id,
            default,
            "Oil Change",
            Cost: 100.00m
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateMaintenanceRecordAsync(request));
        Assert.Contains("Valid maintenance date is required", ex.Message);
    }

    [Fact]
    public async Task CreateMaintenanceRecord_InvalidNextMaintenanceDate_ThrowsArgumentException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1007", VehicleType = "Van", Make = "Toyota", Model = "HiAce", Capacity = 1500, Status = VehicleStatus.Available };
        context.Vehicles.Add(vehicle);
        await context.SaveChangesAsync();

        var service = new FleetService(context);
        var maintenanceDate = DateTime.UtcNow;
        var earlierNextDate = maintenanceDate.AddDays(-5); // Next date is earlier than maintenance date

        var request = new CreateMaintenanceRecordRequest(
            vehicle.Id,
            maintenanceDate,
            "Oil Change",
            Cost: 100.00m,
            NextMaintenanceDate: earlierNextDate
        );

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateMaintenanceRecordAsync(request));
        Assert.Contains("Next maintenance date cannot be earlier", ex.Message);
    }

    [Fact]
    public async Task GetMaintenanceRecordsByVehicleId_ReturnsFilteredRecords()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle1 = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1008", VehicleType = "Van", Make = "Toyota", Model = "HiAce", Capacity = 1500 };
        var vehicle2 = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1009", VehicleType = "Truck", Make = "Isuzu", Model = "Elf", Capacity = 3000 };
        context.Vehicles.AddRange(vehicle1, vehicle2);

        context.MaintenanceRecords.Add(new MaintenanceRecord { Id = Guid.NewGuid(), VehicleId = vehicle1.Id, MaintenanceDate = DateTime.UtcNow, MaintenanceType = "Oil Change", Cost = 100, Vehicle = vehicle1 });
        context.MaintenanceRecords.Add(new MaintenanceRecord { Id = Guid.NewGuid(), VehicleId = vehicle2.Id, MaintenanceDate = DateTime.UtcNow, MaintenanceType = "Engine Overhaul", Cost = 1200, Vehicle = vehicle2 });
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act
        var result = await service.GetMaintenanceRecordsByVehicleIdAsync(vehicle1.Id);

        // Assert
        Assert.Single(result);
        Assert.Equal(vehicle1.Id, result.First().VehicleId);
        Assert.Equal("WP CAB-1008", result.First().VehicleRegistrationNumber);
    }

    [Fact]
    public async Task GetVehicleMaintenanceStatus_EvaluatesCorrectly()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var vehicle = new Vehicle { Id = Guid.NewGuid(), RegistrationNumber = "WP CAB-1010", VehicleType = "Van", Make = "Toyota", Model = "HiAce", Capacity = 1500, Status = VehicleStatus.Available };
        var pastDate = DateTime.UtcNow.AddMonths(-1);
        var overdueNextDate = DateTime.UtcNow.AddDays(-2); // Overdue maintenance

        var record = new MaintenanceRecord
        {
            Id = Guid.NewGuid(),
            VehicleId = vehicle.Id,
            MaintenanceDate = pastDate,
            NextMaintenanceDate = overdueNextDate,
            MaintenanceType = "Filter Change",
            Cost = 80.00m,
            Status = MaintenanceStatus.Completed,
            Vehicle = vehicle
        };
        context.Vehicles.Add(vehicle);
        context.MaintenanceRecords.Add(record);
        await context.SaveChangesAsync();

        var service = new FleetService(context);

        // Act
        var status = await service.GetVehicleMaintenanceStatusAsync(vehicle.Id);

        // Assert
        Assert.NotNull(status);
        Assert.Equal(vehicle.Id, status.VehicleId);
        Assert.False(status.CurrentlyInMaintenance);
        Assert.True(status.MaintenanceDue);
        Assert.Equal(overdueNextDate, status.NextMaintenanceDate);
        Assert.Equal(pastDate, status.LatestMaintenanceDate);
    }
}
