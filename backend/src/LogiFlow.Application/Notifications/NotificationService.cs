using LogiFlow.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LogiFlow.Application.Notifications;

public class NotificationService : INotificationService
{
    private const int MaxRows = 50;

    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public NotificationService(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<IReadOnlyList<NotificationResponse>> ListAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return Array.Empty<NotificationResponse>();
        }

        return await _context.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId)
            .OrderByDescending(notification => notification.CreatedAt)
            .Take(MaxRows)
            .Select(notification => new NotificationResponse(
                notification.Id,
                notification.Type.ToString(),
                notification.Title,
                notification.Message,
                notification.OrderId,
                notification.IsRead,
                notification.CreatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<int> UnreadCountAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return 0;
        }

        return await _context.Notifications
            .CountAsync(notification => notification.UserId == userId && !notification.IsRead, cancellationToken);
    }

    public async Task MarkReadAsync(Guid notificationId, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return;
        }

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(
                item => item.Id == notificationId && item.UserId == userId,
                cancellationToken);

        if (notification is { IsRead: false })
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkAllReadAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
        {
            return;
        }

        var unread = await _context.Notifications
            .Where(item => item.UserId == userId && !item.IsRead)
            .ToListAsync(cancellationToken);

        if (unread.Count == 0)
        {
            return;
        }

        foreach (var notification in unread)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
