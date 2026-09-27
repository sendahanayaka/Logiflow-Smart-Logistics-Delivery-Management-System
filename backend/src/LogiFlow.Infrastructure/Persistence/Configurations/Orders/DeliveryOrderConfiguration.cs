using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Orders;

public class DeliveryOrderConfiguration : IEntityTypeConfiguration<DeliveryOrder>
{
    public void Configure(EntityTypeBuilder<DeliveryOrder> builder)
    {
        builder.ToTable("DeliveryOrders", table =>
        {
            table.HasCheckConstraint("CK_DeliveryOrders_Weight_Positive", "\"WeightKg\" > 0");
            table.HasCheckConstraint("CK_DeliveryOrders_Dimensions_Positive", "\"LengthCm\" > 0 AND \"WidthCm\" > 0 AND \"HeightCm\" > 0");
        });

        builder.HasKey(o => o.Id);

        builder.Property(o => o.PickupAddress).IsRequired().HasMaxLength(500);
        builder.Property(o => o.PickupCity).IsRequired().HasMaxLength(100);

        builder.Property(o => o.DeliveryAddress).IsRequired().HasMaxLength(500);
        builder.Property(o => o.DeliveryCity).IsRequired().HasMaxLength(100);

        builder.Property(o => o.Priority).IsRequired().HasConversion<string>().HasMaxLength(50);
        builder.Property(o => o.Status).IsRequired().HasConversion<string>().HasMaxLength(50);

        builder.Property(o => o.PackageDescription).IsRequired().HasMaxLength(500);

        builder.Property(o => o.WeightKg).IsRequired().HasPrecision(18, 3);
        builder.Property(o => o.LengthCm).IsRequired().HasPrecision(10, 2);
        builder.Property(o => o.WidthCm).IsRequired().HasPrecision(10, 2);
        builder.Property(o => o.HeightCm).IsRequired().HasPrecision(10, 2);

        builder.Property(o => o.SpecialHandling).HasMaxLength(500).IsRequired(false);

        builder.Property(o => o.RecipientName).HasMaxLength(255);
        builder.Property(o => o.RecipientContact).HasMaxLength(100);

        builder.HasOne(o => o.Customer)
            .WithMany()
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
