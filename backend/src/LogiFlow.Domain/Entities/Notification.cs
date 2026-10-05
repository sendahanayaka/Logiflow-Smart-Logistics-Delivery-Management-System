using LogiFlow.Domain.Enums;

namespace LogiFlow.Domain.Entities;

/// <summary>
/// A notification delivered to a single user (the recipient). Created by the
/// backend at delivery-lifecycle events and polled by the client's bell (item 6).
/// </summary>
public class Notification
{
    public Guid Id { get; set; }

    /// <summary>The recipient user (a customer, for the current events).</summary>
    public Guid UserId { get; set; }

    /// <summary>The order this notification is about, when applicable.</summary>
    public Guid? OrderId { get; set; }

    public NotificationType Type { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
