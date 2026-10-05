namespace LogiFlow.Application.Messaging;

public sealed record MessageDto(
    Guid Id,
    Guid OrderId,
    Guid SenderUserId,
    string SenderRole,
    string Body,
    bool IsRead,
    DateTime CreatedAt);

public sealed record ConversationSummary(
    Guid OrderId,
    string OrderRef,
    string DeliveryCity,
    string CounterpartyName,
    string? LastMessage,
    DateTime? LastMessageAt,
    int UnreadCount);

public interface IMessagingService
{
    /// <summary>Conversations the signed-in user takes part in (as customer or driver).</summary>
    Task<IReadOnlyList<ConversationSummary>> GetMyConversationsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Messages for one order's conversation. Marks the counterparty's messages read.
    /// Throws if the caller is not a participant.
    /// </summary>
    Task<IReadOnlyList<MessageDto>> GetConversationAsync(Guid orderId, CancellationToken cancellationToken = default);

    /// <summary>Send a message into an order's conversation as the signed-in user.</summary>
    Task<MessageDto> SendMessageAsync(Guid orderId, string body, CancellationToken cancellationToken = default);
}
