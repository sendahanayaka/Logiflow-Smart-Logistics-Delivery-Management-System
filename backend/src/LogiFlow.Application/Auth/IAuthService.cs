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
    IdentityError
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
    AuthFailure Failure)
{
    public bool Succeeded => Failure == AuthFailure.None
        && User is not null
        && AccessToken is not null
        && ExpiresAt.HasValue;
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
