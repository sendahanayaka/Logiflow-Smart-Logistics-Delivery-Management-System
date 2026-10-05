/// Per-order customer↔driver conversation DTOs (item 5).
class MessageDto {
  const MessageDto({
    required this.id,
    required this.orderId,
    required this.senderUserId,
    required this.senderRole,
    required this.body,
    required this.isRead,
    required this.createdAt,
  });

  final String id;
  final String orderId;
  final String senderUserId;
  final String senderRole;
  final String body;
  final bool isRead;
  final DateTime createdAt;

  factory MessageDto.fromJson(Map<String, dynamic> json) => MessageDto(
        id: json['id'].toString(),
        orderId: json['orderId'].toString(),
        senderUserId: json['senderUserId'].toString(),
        senderRole: json['senderRole'] as String? ?? '',
        body: json['body'] as String? ?? '',
        isRead: json['isRead'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class ConversationSummary {
  const ConversationSummary({
    required this.orderId,
    required this.orderRef,
    required this.deliveryCity,
    required this.counterpartyName,
    required this.unreadCount,
    this.lastMessage,
    this.lastMessageAt,
  });

  final String orderId;
  final String orderRef;
  final String deliveryCity;
  final String counterpartyName;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;

  factory ConversationSummary.fromJson(Map<String, dynamic> json) => ConversationSummary(
        orderId: json['orderId'].toString(),
        orderRef: json['orderRef'] as String? ?? '',
        deliveryCity: json['deliveryCity'] as String? ?? '',
        counterpartyName: json['counterpartyName'] as String? ?? '',
        lastMessage: json['lastMessage'] as String?,
        lastMessageAt: json['lastMessageAt'] == null
            ? null
            : DateTime.parse(json['lastMessageAt'] as String),
        unreadCount: (json['unreadCount'] as num?)?.toInt() ?? 0,
      );
}
