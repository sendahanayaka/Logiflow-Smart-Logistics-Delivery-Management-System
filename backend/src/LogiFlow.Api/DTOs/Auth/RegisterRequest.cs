namespace LogiFlow.Api.DTOs.Auth;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    string Password,
    string ConfirmPassword);
