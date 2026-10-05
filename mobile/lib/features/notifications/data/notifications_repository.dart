import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import 'notification_models.dart';

/// Notifications API (item 6). Uses the shared authenticated Dio.
class NotificationsRepository {
  NotificationsRepository(this._dio);
  final Dio _dio;

  Future<List<AppNotification>> list() async {
    final res = await _dio.get<List<dynamic>>('/notifications');
    final data = res.data ?? const [];
    return data
        .map((item) => AppNotification.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<int> unreadCount() async {
    final res = await _dio.get<Map<String, dynamic>>('/notifications/unread-count');
    return ((res.data?['count'] ?? 0) as num).toInt();
  }

  Future<void> markRead(String id) => _dio.post('/notifications/$id/read');

  Future<void> markAllRead() => _dio.post('/notifications/read-all');
}

final notificationsRepositoryProvider = Provider<NotificationsRepository>(
  (ref) => NotificationsRepository(ref.read(dioProvider)),
);
