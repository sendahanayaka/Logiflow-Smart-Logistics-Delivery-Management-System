using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

public sealed class User
{
    public Guid Id { get; init; }

    public required string FullName { get; init; }

    public required string Email { get; init; }

    public string? PhoneNumber { get; init; }

    public UserRole Role { get; init; }

    public UserStatus Status { get; init; }

    public DateTimeOffset CreatedAt { get; init; }

    public DateTimeOffset UpdatedAt { get; init; }
}
