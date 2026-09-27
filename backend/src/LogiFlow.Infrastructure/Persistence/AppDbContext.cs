using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogiFlow.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<AssignmentHistory> AssignmentHistories => Set<AssignmentHistory>();
    public DbSet<DutySchedule> DutySchedules => Set<DutySchedule>();
    public DbSet<MaintenanceRecord> MaintenanceRecords => Set<MaintenanceRecord>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
