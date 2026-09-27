using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Fleet;

public class DutyScheduleConfiguration : IEntityTypeConfiguration<DutySchedule>
{
    public void Configure(EntityTypeBuilder<DutySchedule> builder)
    {
        builder.ToTable("DutySchedules");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.DriverId)
            .IsRequired();

        builder.Property(s => s.StartTime)
            .IsRequired();

        builder.Property(s => s.EndTime)
            .IsRequired();

        builder.Property(s => s.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(s => s.Notes)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(s => s.CreatedAt)
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .IsRequired(false);

        // Indexes
        builder.HasIndex(s => s.DriverId);
        builder.HasIndex(s => s.Status);
        builder.HasIndex(s => new { s.DriverId, s.StartTime, s.EndTime });

        // Relationship & Foreign Key
        builder.HasOne(s => s.Driver)
            .WithMany()
            .HasForeignKey(s => s.DriverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
