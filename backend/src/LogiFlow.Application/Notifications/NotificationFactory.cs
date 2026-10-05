using LogiFlow.Domain.Entities;
using LogiFlow.Domain.Enums;

namespace LogiFlow.Application.Notifications;

/// <summary>
/// Builds <see cref="Notification"/> entities for the delivery lifecycle. Callers
/// add the result to the context and persist with their own SaveChanges, so a
/// notification rides the same transaction as the state change that triggered it.
/// </summary>
public static class NotificationFactory
{
    public static Notification OrderPlaced(Guid userId, Guid orderId) => New(
        userId, orderId, NotificationType.OrderPlaced,
        "Order placed",
        "We've received your delivery order. You'll be notified as it progresses.");

    public static Notification OrderApproved(Guid userId, Guid orderId) => New(
        userId, orderId, NotificationType.OrderApproved,
        "Order approved",
        "Your order was approved and a driver has been assigned.");

    public static Notification PickedUp(Guid userId, Guid orderId) => New(
        userId, orderId, NotificationType.PickedUp,
        "Picked up",
        "Your order has been picked up by the driver and is on the way.");

    public static Notification Delivered(Guid userId, Guid orderId) => New(
        userId, orderId, NotificationType.Delivered,
        "Delivered",
        "Your order has been delivered. Thanks for choosing LogiFlow!");

    private static Notification New(
        Guid userId, Guid orderId, NotificationType type, string title, string message) =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrderId = orderId,
            Type = type,
            Title = title,
            Message = message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };
}
