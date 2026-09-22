using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Fleet;

public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.ToTable("Vehicles");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.RegistrationNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(v => v.RegistrationNumber)
            .IsUnique();

        builder.Property(v => v.VehicleType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(v => v.Make)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(v => v.Model)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(v => v.Capacity)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(v => v.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(v => v.CreatedAt)
            .IsRequired();

        builder.Property(v => v.UpdatedAt)
            .IsRequired(false);
    }
}
