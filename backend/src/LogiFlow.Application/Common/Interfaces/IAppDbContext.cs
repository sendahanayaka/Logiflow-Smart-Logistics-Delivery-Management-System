using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogiFlow.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<Driver> Drivers { get; }
    DbSet<Vehicle> Vehicles { get; }
    DbSet<AssignmentHistory> AssignmentHistories { get; }
    DbSet<DutySchedule> DutySchedules { get; }
    DbSet<MaintenanceRecord> MaintenanceRecords { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}


