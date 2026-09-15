using LogiFlow.Infrastructure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LogiFlow.Infrastructure.Persistence.Configurations.Auth;

public sealed class RefreshTokenSessionConfiguration
    : IEntityTypeConfiguration<RefreshTokenSession>
{
    public void Configure(EntityTypeBuilder<RefreshTokenSession> builder)
    {
        builder.ToTable("RefreshTokenSessions");

        builder.HasKey(session => session.Id);

        builder.Property(session => session.TokenHash)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(session => session.CreatedAt)
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(session => session.ExpiresAt)
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        builder.Property(session => session.RevokedAt)
            .HasColumnType("timestamp with time zone");

        builder.Property(session => session.ConcurrencyToken)
            .IsConcurrencyToken()
            .IsRequired();

        builder.HasIndex(session => session.TokenHash)
            .IsUnique();

        builder.HasIndex(session => session.UserId);

        builder.HasIndex(session => session.ExpiresAt);

        builder.HasOne(session => session.User)
            .WithMany(user => user.RefreshTokenSessions)
            .HasForeignKey(session => session.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(session => session.ReplacedByToken)
            .WithMany()
            .HasForeignKey(session => session.ReplacedByTokenId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
