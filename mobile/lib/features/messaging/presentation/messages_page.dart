import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../data/messaging_models.dart';
import '../data/messaging_repository.dart';
import 'conversation_page.dart';

/// Inbox of the signed-in user's conversations (customer or driver).
class MessagesPage extends ConsumerStatefulWidget {
  const MessagesPage({super.key});

  @override
  ConsumerState<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends ConsumerState<MessagesPage> {
  late Future<List<ConversationSummary>> _future;

  @override
  void initState() {
    super.initState();
    _future = ref.read(messagingRepositoryProvider).conversations();
  }

  void _reload() => setState(() => _future = ref.read(messagingRepositoryProvider).conversations());

  Future<void> _open(ConversationSummary c) async {
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => ConversationPage(orderId: c.orderId, title: c.counterpartyName),
    ));
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: FutureBuilder<List<ConversationSummary>>(
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
                  const Text('Could not load conversations.'),
                  const SizedBox(height: 12),
                  OutlinedButton(onPressed: _reload, child: const Text('Retry')),
                ],
              ),
            );
          }
          final items = snapshot.data ?? const <ConversationSummary>[];
          if (items.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  "No conversations yet. A chat appears here once a driver is assigned to your order.",
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final c = items[i];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFF08006C),
                    child: Text(
                      c.counterpartyName.isNotEmpty ? c.counterpartyName[0].toUpperCase() : '?',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                  title: Text(c.counterpartyName),
                  subtitle: Text(
                    c.lastMessage ?? 'Order ${c.orderRef} · ${c.deliveryCity}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (c.lastMessageAt != null)
                        Text(
                          DateFormat('h:mm a').format(c.lastMessageAt!.toLocal()),
                          style: const TextStyle(fontSize: 11, color: Colors.black45),
                        ),
                      if (c.unreadCount > 0)
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD9534F),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text('${c.unreadCount}',
                              style: const TextStyle(color: Colors.white, fontSize: 10)),
                        ),
                    ],
                  ),
                  onTap: () => _open(c),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
