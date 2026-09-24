using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Auth;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");

        builder.HasKey(r => r.Id);
        
        builder.Property(r => r.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(r => r.Name).IsUnique();

        // Seed initial roles
        builder.HasData(
            new Role { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "ADMIN" },
            new Role { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "CUSTOMER" },
            new Role { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "WAREHOUSE_STAFF" },
            new Role { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "DRIVER" }
        );
    }
}
