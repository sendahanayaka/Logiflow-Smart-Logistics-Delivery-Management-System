namespace LogiFlow.Api.DTOs.Users;

public sealed record UpdateUserRequest(
    string FullName,
    string Email,
    string PhoneNumber);
