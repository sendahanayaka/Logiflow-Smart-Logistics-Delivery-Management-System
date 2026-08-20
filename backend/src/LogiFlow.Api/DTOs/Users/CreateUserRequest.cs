using LogiFlow.Domain.Enums;

namespace LogiFlow.Api.DTOs.Users;

public sealed record CreateUserRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    UserRole Role);
