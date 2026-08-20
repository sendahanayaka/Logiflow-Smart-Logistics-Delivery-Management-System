using LogiFlow.Domain.Enums;

namespace LogiFlow.Api.DTOs.Auth;

public sealed record UserResponse(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    UserRole Role,
    UserStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
