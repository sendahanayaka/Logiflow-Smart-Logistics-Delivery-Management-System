using LogiFlow.Application.Common.Interfaces;
using LogiFlow.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LogiFlow.Application.Messaging;

public class MessagingService : IMessagingService
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public MessagingService(IAppDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    private Guid Me => _currentUser.UserId
        ?? throw new UnauthorizedAccessException("Not authenticated.");

    public async Task<IReadOnlyList<ConversationSummary>> GetMyConversationsAsync(
        CancellationToken cancellationToken = default)
    {
        var me = Me;

        // Orders where I'm the customer.
        var asCustomer = await _context.DeliveryOrders
            .AsNoTracking()
            .Where(order => order.CustomerId == me)
            .Select(order => order.Id)
            .ToListAsync(cancellationToken);

        // Orders on shipments assigned to me (if I'm a driver).
        var myDriverId = await _context.Drivers
            .AsNoTracking()
            .Where(driver => driver.UserId == me)
            .Select(driver => (Guid?)driver.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var asDriver = new List<Guid>();
        if (myDriverId is not null)
        {
            var workflowIds = await _context.Shipments
                .AsNoTracking()
                .Where(shipment => shipment.DriverId == myDriverId)
                .Select(shipment => shipment.AgentWorkflowId)
                .ToListAsync(cancellationToken);

            asDriver = await _context.RouteStops
                .AsNoTracking()
                .Where(stop => workflowIds.Contains(stop.AgentWorkflowId))
                .Select(stop => stop.OrderId)
                .Distinct()
                .ToListAsync(cancellationToken);
        }

        var orderIds = asCustomer.Concat(asDriver).Distinct().ToList();
        var summaries = new List<ConversationSummary>();

        foreach (var orderId in orderIds)
        {
            var participants = await ResolveParticipantsAsync(orderId, cancellationToken);
            if (participants is null)
            {
                continue;
            }

            var iAmCustomer = participants.CustomerUserId == me;
            // Skip customer-side conversations with no driver yet and no messages.
            var messages = await _context.Messages
                .AsNoTracking()
                .Where(message => message.OrderId == orderId)
                .ToListAsync(cancellationToken);

            if (iAmCustomer && participants.DriverUserId is null && messages.Count == 0)
            {
                continue;
            }

            var counterparty = iAmCustomer
                ? participants.DriverName ?? "Driver (assigning…)"
                : participants.CustomerName ?? "Customer";

            var last = messages.OrderByDescending(message => message.CreatedAt).FirstOrDefault();
            var unread = messages.Count(message => message.SenderUserId != me && !message.IsRead);

            summaries.Add(new ConversationSummary(
                orderId,
                $"#{orderId.ToString()[..8].ToUpperInvariant()}",
                participants.DeliveryCity,
                counterparty,
                last?.Body,
                last?.CreatedAt,
                unread));
        }

        return summaries
            .OrderByDescending(summary => summary.LastMessageAt ?? DateTime.MinValue)
            .ToList();
    }

    public async Task<IReadOnlyList<MessageDto>> GetConversationAsync(
        Guid orderId, CancellationToken cancellationToken = default)
    {
        var me = Me;
        var participants = await ResolveParticipantsAsync(orderId, cancellationToken)
            ?? throw new KeyNotFoundException($"Order '{orderId}' was not found.");

        EnsureParticipant(participants, me);

        var messages = await _context.Messages
            .Where(message => message.OrderId == orderId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync(cancellationToken);

        // Mark the counterparty's messages read.
        var changed = false;
        foreach (var message in messages.Where(m => m.SenderUserId != me && !m.IsRead))
        {
            message.IsRead = true;
            changed = true;
        }
        if (changed)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return messages.Select(Map).ToList();
    }

    public async Task<MessageDto> SendMessageAsync(
        Guid orderId, string body, CancellationToken cancellationToken = default)
    {
        var me = Me;
        var text = (body ?? string.Empty).Trim();
        if (text.Length == 0)
        {
            throw new ArgumentException("Message cannot be empty.", nameof(body));
        }
        if (text.Length > 2000)
        {
            throw new ArgumentException("Message cannot exceed 2000 characters.", nameof(body));
        }

        var participants = await ResolveParticipantsAsync(orderId, cancellationToken)
            ?? throw new KeyNotFoundException($"Order '{orderId}' was not found.");

        var role = RoleFor(participants, me);

        var message = new Message
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            SenderUserId = me,
            SenderRole = role,
            Body = text,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync(cancellationToken);

        return Map(message);
    }

    // --- helpers --------------------------------------------------------------

    private sealed record Participants(
        Guid CustomerUserId,
        string? CustomerName,
        Guid? DriverUserId,
        string? DriverName,
        string DeliveryCity);

    private async Task<Participants?> ResolveParticipantsAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var order = await _context.DeliveryOrders
            .AsNoTracking()
            .Where(item => item.Id == orderId)
            .Select(item => new { item.Id, item.CustomerId, item.DeliveryCity })
            .FirstOrDefaultAsync(cancellationToken);

        if (order is null)
        {
            return null;
        }

        var customerName = await _context.Users
            .AsNoTracking()
            .Where(user => user.Id == order.CustomerId)
            .Select(user => user.Name)
            .FirstOrDefaultAsync(cancellationToken);

        Guid? driverUserId = null;
        string? driverName = null;

        var stop = await _context.RouteStops
            .AsNoTracking()
            .Where(routeStop => routeStop.OrderId == orderId)
            .OrderByDescending(routeStop => routeStop.CreatedAt)
            .Select(routeStop => new { routeStop.AgentWorkflowId })
            .FirstOrDefaultAsync(cancellationToken);

        if (stop is not null)
        {
            var driverId = await _context.Shipments
                .AsNoTracking()
                .Where(shipment => shipment.AgentWorkflowId == stop.AgentWorkflowId)
                .Select(shipment => (Guid?)shipment.DriverId)
                .FirstOrDefaultAsync(cancellationToken);

            if (driverId is not null)
            {
                var driver = await _context.Drivers
                    .AsNoTracking()
                    .Where(d => d.Id == driverId)
                    .Select(d => new { d.UserId, d.FullName })
                    .FirstOrDefaultAsync(cancellationToken);
                driverUserId = driver?.UserId;
                driverName = driver?.FullName;
            }
        }

        return new Participants(order.CustomerId, customerName, driverUserId, driverName, order.DeliveryCity);
    }

    private static void EnsureParticipant(Participants participants, Guid me)
    {
        if (me != participants.CustomerUserId && me != participants.DriverUserId)
        {
            throw new UnauthorizedAccessException("You are not a participant in this conversation.");
        }
    }

    private static string RoleFor(Participants participants, Guid me)
    {
        if (me == participants.CustomerUserId) return "CUSTOMER";
        if (me == participants.DriverUserId) return "DRIVER";
        throw new UnauthorizedAccessException("You are not a participant in this conversation.");
    }

    private static MessageDto Map(Message message) => new(
        message.Id, message.OrderId, message.SenderUserId, message.SenderRole,
        message.Body, message.IsRead, message.CreatedAt);
}
