using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Auth;

public sealed class AuthService : IAuthService
{
    private readonly IIdentityService _identityService;
    private readonly ITokenService _tokenService;

    public AuthService(
        IIdentityService identityService,
        ITokenService tokenService)
    {
        _identityService = identityService;
        _tokenService = tokenService;
    }

    public Task<RegistrationResult> RegisterAsync(
        string fullName,
        string email,
        string phoneNumber,
        string password,
        CancellationToken cancellationToken = default)
    {
        return _identityService.CreateCustomerAsync(
            fullName,
            email,
            phoneNumber,
            password,
            cancellationToken);
    }

    public async Task<LoginResult> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var user = await _identityService.ValidateCredentialsAsync(
            email,
            password,
            cancellationToken);

        if (user is null)
        {
            return new LoginResult(
                null,
                null,
                null,
                AuthFailure.InvalidCredentials);
        }

        if (user.Status == UserStatus.Inactive)
        {
            return new LoginResult(
                null,
                null,
                null,
                AuthFailure.InactiveAccount);
        }

        if (user.Status == UserStatus.Suspended)
        {
            return new LoginResult(
                null,
                null,
                null,
                AuthFailure.SuspendedAccount);
        }

        var accessToken = _tokenService.CreateAccessToken(user);

        return new LoginResult(
            user,
            accessToken.Value,
            accessToken.ExpiresAt,
            AuthFailure.None);
    }

    public Task<User?> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return _identityService.FindByIdAsync(userId, cancellationToken);
    }
}
