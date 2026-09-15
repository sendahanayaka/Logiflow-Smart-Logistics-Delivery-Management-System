namespace LogiFlow.Infrastructure.Auth;

public sealed record JwtOptions(
    string Issuer,
    string Audience,
    string SigningKey,
    int ExpiryMinutes,
    int RefreshTokenExpiryDays);
