namespace LogiFlow.Application.Notifications;

public sealed record NotificationResponse(
    Guid Id,
    string Type,
    string Title,
    string Message,
    Guid? OrderId,
    bool IsRead,
    DateTime CreatedAt);

public interface INotificationService
{
    /// <summary>The signed-in user's notifications, newest first (capped).</summary>
    Task<IReadOnlyList<NotificationResponse>> ListAsync(CancellationToken cancellationToken = default);

    /// <summary>Count of the signed-in user's unread notifications (for the bell badge).</summary>
    Task<int> UnreadCountAsync(CancellationToken cancellationToken = default);

    /// <summary>Mark one of the signed-in user's notifications read.</summary>
    Task MarkReadAsync(Guid notificationId, CancellationToken cancellationToken = default);

    /// <summary>Mark all of the signed-in user's notifications read.</summary>
    Task MarkAllReadAsync(CancellationToken cancellationToken = default);
}
