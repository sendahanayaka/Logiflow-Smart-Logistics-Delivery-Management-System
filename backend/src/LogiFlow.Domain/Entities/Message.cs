namespace LogiFlow.Domain.Entities;

/// <summary>
/// A direct message in the per-order conversation between the customer and the
/// assigned driver (item 5). The conversation is scoped to an order; both
/// participants are derived from the order + its shipment.
/// </summary>
public class Message
{
    public Guid Id { get; set; }

    /// <summary>The order this conversation belongs to.</summary>
    public Guid OrderId { get; set; }

    /// <summary>The user who sent the message.</summary>
    public Guid SenderUserId { get; set; }

    /// <summary>CUSTOMER | DRIVER | SYSTEM — for rendering the bubble side.</summary>
    public string SenderRole { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;

    /// <summary>True once the counterparty has opened the conversation.</summary>
    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
