import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../data/notification_models.dart';
import '../data/notifications_repository.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  late Future<List<AppNotification>> _future;

  @override
  void initState() {
    super.initState();
    _future = ref.read(notificationsRepositoryProvider).list();
  }

  void _reload() => setState(() => _future = ref.read(notificationsRepositoryProvider).list());

  Future<void> _markAll() async {
    await ref.read(notificationsRepositoryProvider).markAllRead();
    _reload();
  }

  Future<void> _tap(AppNotification n) async {
    if (!n.isRead) {
      await ref.read(notificationsRepositoryProvider).markRead(n.id);
      _reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(onPressed: _markAll, child: const Text('Mark all read')),
        ],
      ),
      body: FutureBuilder<List<AppNotification>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Could not load notifications.'),
                  const SizedBox(height: 12),
                  OutlinedButton(onPressed: _reload, child: const Text('Retry')),
                ],
              ),
            );
          }
          final items = snapshot.data ?? const <AppNotification>[];
          if (items.isEmpty) {
            return const Center(child: Text("You're all caught up."));
          }
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final n = items[index];
                return ListTile(
                  tileColor: n.isRead ? null : const Color(0xFFEEF2FF),
                  leading: CircleAvatar(
                    backgroundColor: n.isRead ? Colors.black12 : const Color(0xFF08006C),
                    child: Icon(
                      n.isRead ? Icons.notifications_none : Icons.notifications_active,
                      color: n.isRead ? Colors.black45 : Colors.white,
                      size: 20,
                    ),
                  ),
                  title: Text(n.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(n.message),
                  trailing: Text(
                    DateFormat('d MMM, h:mm a').format(n.createdAt.toLocal()),
                    style: const TextStyle(fontSize: 11, color: Colors.black45),
                  ),
                  isThreeLine: true,
                  onTap: () => _tap(n),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
