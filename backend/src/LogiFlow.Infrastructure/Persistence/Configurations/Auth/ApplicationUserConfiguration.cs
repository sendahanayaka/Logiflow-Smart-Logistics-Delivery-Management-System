using LogiFlow.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Auth;

public sealed class ApplicationUserConfiguration
    : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(user => user.FullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(user => user.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(user => user.PhoneNumber)
            .HasMaxLength(32);

        builder.Property(user => user.Status)
            .HasConversion<string>()
            .HasMaxLength(32)
            .IsRequired();

        builder.Property(user => user.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(user => user.UpdatedAt)
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.HasIndex(user => user.NormalizedEmail)
            .IsUnique()
            .HasDatabaseName("EmailIndex");

        builder.HasIndex(user => user.Status)
            .HasDatabaseName("IX_AspNetUsers_Status");
    }
}
