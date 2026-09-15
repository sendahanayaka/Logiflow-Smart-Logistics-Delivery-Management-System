using LogiFlow.Domain.Entities;

namespace LogiFlow.Application.Auth;

public interface ITokenService
{
    AccessToken CreateAccessToken(User user);
}

public sealed record AccessToken(
    string Value,
    DateTimeOffset ExpiresAt);
