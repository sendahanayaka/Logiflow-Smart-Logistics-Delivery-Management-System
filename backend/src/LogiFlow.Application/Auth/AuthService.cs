using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Auth;

public sealed class AuthService : IAuthService
{
    private readonly IIdentityService _identityService;
    private readonly ITokenService _tokenService;
    private readonly IRefreshSessionService _refreshSessionService;

    public AuthService(
        IIdentityService identityService,
        ITokenService tokenService,
        IRefreshSessionService refreshSessionService)
    {
        _identityService = identityService;
        _tokenService = tokenService;
        _refreshSessionService = refreshSessionService;
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
                null,
                AuthFailure.InvalidCredentials);
        }

        if (user.Status == UserStatus.Inactive)
        {
            return new LoginResult(
                null,
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
                null,
                AuthFailure.SuspendedAccount);
        }

        var accessToken = _tokenService.CreateAccessToken(user);
        var refreshToken = await _refreshSessionService.CreateAsync(
            user.Id,
            cancellationToken);

        return new LoginResult(
            user,
            accessToken.Value,
            accessToken.ExpiresAt,
            refreshToken,
            AuthFailure.None);
    }

    public async Task<LoginResult> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var rotation = await _refreshSessionService.RotateAsync(
            refreshToken,
            cancellationToken);

        if (!rotation.Succeeded)
        {
            return new LoginResult(
                null,
                null,
                null,
                null,
                AuthFailure.InvalidRefreshToken);
        }

        var accessToken = _tokenService.CreateAccessToken(rotation.User!);

        return new LoginResult(
            rotation.User,
            accessToken.Value,
            accessToken.ExpiresAt,
            rotation.RefreshToken,
            AuthFailure.None);
    }

    public Task RevokeRefreshTokenAsync(
        string? refreshToken,
        CancellationToken cancellationToken = default)
    {
        return string.IsNullOrWhiteSpace(refreshToken)
            ? Task.CompletedTask
            : _refreshSessionService.RevokeAsync(
                refreshToken,
                cancellationToken);
    }

    public Task<User?> GetCurrentUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return _identityService.FindByIdAsync(userId, cancellationToken);
    }
}
