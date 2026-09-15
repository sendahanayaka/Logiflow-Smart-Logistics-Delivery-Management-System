namespace LogiFlow.Infrastructure.Identity;

public sealed class RefreshTokenSession
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    public required string TokenHash { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }

    public Guid? ReplacedByTokenId { get; set; }

    public RefreshTokenSession? ReplacedByToken { get; set; }

    public Guid ConcurrencyToken { get; set; }
}
