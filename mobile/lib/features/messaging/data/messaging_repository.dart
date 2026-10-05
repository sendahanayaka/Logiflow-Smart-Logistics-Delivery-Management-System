import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import 'messaging_models.dart';

/// Messaging API (item 5) — uses the shared authenticated Dio.
class MessagingRepository {
  MessagingRepository(this._dio);
  final Dio _dio;

  Future<List<ConversationSummary>> conversations() async {
    final res = await _dio.get<List<dynamic>>('/conversations');
    final data = res.data ?? const [];
    return data
        .map((item) => ConversationSummary.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<List<MessageDto>> messages(String orderId) async {
    final res = await _dio.get<List<dynamic>>('/orders/$orderId/messages');
    final data = res.data ?? const [];
    return data
        .map((item) => MessageDto.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<MessageDto> send(String orderId, String body) async {
    final res = await _dio.post<Map<String, dynamic>>(
      '/orders/$orderId/messages',
      data: {'body': body},
    );
    return MessageDto.fromJson(Map<String, dynamic>.from(res.data as Map));
  }
}

final messagingRepositoryProvider = Provider<MessagingRepository>(
  (ref) => MessagingRepository(ref.read(dioProvider)),
);
