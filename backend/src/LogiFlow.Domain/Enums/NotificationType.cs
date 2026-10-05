namespace LogiFlow.Domain.Enums;

/// <summary>Customer-facing delivery lifecycle notifications (item 6).</summary>
public enum NotificationType
{
    OrderPlaced = 0,
    OrderApproved = 1,   // admin approved → driver assigned / handed over
    PickedUp = 2,        // driver started the run (dispatched)
    InTransit = 3,
    Delivered = 4
}
