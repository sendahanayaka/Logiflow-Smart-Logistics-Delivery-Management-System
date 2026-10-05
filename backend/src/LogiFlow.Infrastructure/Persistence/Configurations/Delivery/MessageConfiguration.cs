using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Delivery;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");
        builder.HasKey(message => message.Id);

        builder.Property(message => message.SenderRole)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(message => message.Body)
            .IsRequired()
            .HasMaxLength(2000);

        // Conversation load: by order, ordered by time.
        builder.HasIndex(message => new { message.OrderId, message.CreatedAt });
    }
}
