using System.Security.Cryptography;
using System.Text;
using LogiFlow.Application.Auth;
using LogiFlow.Domain.Enums;
using LogiFlow.Infrastructure.Identity;
using LogiFlow.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace LogiFlow.Infrastructure.Auth;

public sealed class RefreshSessionService : IRefreshSessionService
{
    private const int RefreshTokenBytes = 64;
    private const int MaximumPresentedTokenLength = 1024;

    private readonly AppDbContext _dbContext;
    private readonly IIdentityService _identityService;
    private readonly JwtOptions _options;

    public RefreshSessionService(
        AppDbContext dbContext,
        IIdentityService identityService,
        JwtOptions options)
    {
        _dbContext = dbContext;
        _identityService = identityService;
        _options = options;
    }

    public async Task<IssuedRefreshToken> CreateAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var token = GenerateToken();
        _dbContext.RefreshTokenSessions.Add(CreateSession(userId, token));
        await _dbContext.SaveChangesAsync(cancellationToken);
        return token;
    }

    public async Task<RefreshSessionRotationResult> RotateAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (!CanHash(refreshToken))
        {
            return RotationFailure(RefreshSessionFailure.InvalidToken);
        }

        var now = DateTimeOffset.UtcNow;
        var tokenHash = HashToken(refreshToken);
        await using var transaction = await _dbContext.Database
            .BeginTransactionAsync(cancellationToken);
        var currentSession = await _dbContext.RefreshTokenSessions
            .SingleOrDefaultAsync(
                session => session.TokenHash == tokenHash,
                cancellationToken);

        if (currentSession is null
            || currentSession.RevokedAt.HasValue
            || currentSession.ExpiresAt <= now)
        {
            return RotationFailure(RefreshSessionFailure.InvalidToken);
        }

        var user = await _identityService.FindByIdAsync(
            currentSession.UserId,
            cancellationToken);

        if (user is null || user.Status != UserStatus.Active)
        {
            return RotationFailure(RefreshSessionFailure.InactiveAccount);
        }

        var replacement = GenerateToken();
        var replacementSession = CreateSession(user.Id, replacement);
        currentSession.RevokedAt = now;
        currentSession.ReplacedByTokenId = replacementSession.Id;
        currentSession.ConcurrencyToken = Guid.NewGuid();
        _dbContext.RefreshTokenSessions.Add(replacementSession);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return RotationFailure(RefreshSessionFailure.InvalidToken);
        }

        return new RefreshSessionRotationResult(
            user,
            replacement,
            RefreshSessionFailure.None);
    }

    public async Task RevokeAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (!CanHash(refreshToken))
        {
            return;
        }

        var tokenHash = HashToken(refreshToken);
        var session = await _dbContext.RefreshTokenSessions
            .SingleOrDefaultAsync(
                candidate => candidate.TokenHash == tokenHash,
                cancellationToken);

        if (session is null || session.RevokedAt.HasValue)
        {
            return;
        }

        session.RevokedAt = DateTimeOffset.UtcNow;
        session.ConcurrencyToken = Guid.NewGuid();

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            // Another request already revoked or rotated this session.
        }
    }

    private IssuedRefreshToken GenerateToken()
    {
        var value = Base64UrlEncoder.Encode(
            RandomNumberGenerator.GetBytes(RefreshTokenBytes));

        return new IssuedRefreshToken(
            value,
            DateTimeOffset.UtcNow.AddDays(_options.RefreshTokenExpiryDays));
    }

    private static RefreshTokenSession CreateSession(
        Guid userId,
        IssuedRefreshToken token)
    {
        return new RefreshTokenSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = HashToken(token.Value),
            CreatedAt = DateTimeOffset.UtcNow,
            ExpiresAt = token.ExpiresAt,
            ConcurrencyToken = Guid.NewGuid()
        };
    }

    private static bool CanHash(string refreshToken) =>
        !string.IsNullOrWhiteSpace(refreshToken)
        && refreshToken.Length <= MaximumPresentedTokenLength;

    private static string HashToken(string refreshToken)
    {
        return Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));
    }

    private static RefreshSessionRotationResult RotationFailure(
        RefreshSessionFailure failure)
    {
        return new RefreshSessionRotationResult(null, null, failure);
    }
}
