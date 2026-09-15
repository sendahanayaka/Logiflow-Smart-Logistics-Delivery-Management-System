using LogiFlow.Domain.Entities;

namespace LogiFlow.Application.Auth;

public interface IAuthService
{
    Task<RegistrationResult> RegisterAsync(
        string fullName,
        string email,
        string phoneNumber,
        string password,
        CancellationToken cancellationToken = default);

    Task<LoginResult> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);

    Task<LoginResult> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);

    Task RevokeRefreshTokenAsync(
        string? refreshToken,
        CancellationToken cancellationToken = default);

    Task<User?> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}

public enum AuthFailure
{
    None,
    DuplicateEmail,
    InvalidCredentials,
    InactiveAccount,
    SuspendedAccount,
    IdentityError,
    InvalidRefreshToken
}

public sealed record RegistrationResult(
    User? User,
    AuthFailure Failure,
    IReadOnlyCollection<string> Errors)
{
    public bool Succeeded => Failure == AuthFailure.None && User is not null;
}

public sealed record LoginResult(
    User? User,
    string? AccessToken,
    DateTimeOffset? ExpiresAt,
    IssuedRefreshToken? RefreshToken,
    AuthFailure Failure)
{
    public bool Succeeded => Failure == AuthFailure.None
        && User is not null
        && AccessToken is not null
        && ExpiresAt.HasValue
        && RefreshToken is not null;
}

public sealed record IssuedRefreshToken(
    string Value,
    DateTimeOffset ExpiresAt);

public enum RefreshSessionFailure
{
    None,
    InvalidToken,
    InactiveAccount
}

public sealed record RefreshSessionRotationResult(
    User? User,
    IssuedRefreshToken? RefreshToken,
    RefreshSessionFailure Failure)
{
    public bool Succeeded => Failure == RefreshSessionFailure.None
        && User is not null
        && RefreshToken is not null;
}

public interface IRefreshSessionService
{
    Task<IssuedRefreshToken> CreateAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<RefreshSessionRotationResult> RotateAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        string refreshToken,
        CancellationToken cancellationToken = default);
}

public interface IIdentityService
{
    Task<RegistrationResult> CreateCustomerAsync(
        string fullName,
        string email,
        string phoneNumber,
        string password,
        CancellationToken cancellationToken = default);

    Task<User?> ValidateCredentialsAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);

    Task<User?> FindByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}
