namespace LogiFlow.Api.DTOs.Auth;

public sealed record LoginResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    UserResponse User);
