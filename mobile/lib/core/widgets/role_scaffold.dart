import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/session_controller.dart';

/// Standard shell for each role's home screen: title, sign-out, and (until the
/// owner builds the screens) a checklist of what belongs here.
class RoleScaffold extends ConsumerWidget {
  const RoleScaffold({
    super.key,
    required this.title,
    required this.owner,
    required this.todo,
    this.child,
    this.actions,
  });

  final String title;
  final String owner;
  final List<String> todo;
  final Widget? child;

  /// Extra app-bar actions, shown before the sign-out button.
  final List<Widget>? actions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionControllerProvider).user;
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          ...?actions,
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(sessionControllerProvider.notifier).signOut(),
          ),
        ],
      ),
      body: child ??
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Signed in as ${user?.name ?? ''} (${user?.email ?? ''})'),
                const SizedBox(height: 4),
                Text('Owner: $owner', style: const TextStyle(color: Colors.grey)),
                const Divider(height: 28),
                const Text('Screens to build here:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ...todo.map((t) => ListTile(
                      dense: true,
                      leading: const Icon(Icons.check_box_outline_blank, size: 18),
                      title: Text(t),
                    )),
              ],
            ),
          ),
    );
  }
}
