using LogiFlow.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace LogiFlow.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public required string FullName { get; set; }

    public UserStatus Status { get; set; } = UserStatus.Active;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
