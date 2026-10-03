import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/auth/session_controller.dart';
import '../../../../core/theme/app_theme.dart';

/// Profile tab: who's signed in + sign out. (Phase 1)
class CustomerProfileTab extends ConsumerWidget {
  const CustomerProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionControllerProvider).user;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const SizedBox(height: 8),
        Center(
          child: CircleAvatar(
            radius: 40,
            backgroundColor: AppTheme.navy,
            child: Text(
              (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : '?',
              style: const TextStyle(fontSize: 32, color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Center(child: Text(user?.name ?? 'Customer', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold))),
        Center(child: Text(user?.email ?? '', style: const TextStyle(color: Colors.black54))),
        const SizedBox(height: 32),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.badge_outlined),
          title: const Text('Role'),
          trailing: Text(user?.role.name ?? '-'),
        ),
        const Divider(),
        const SizedBox(height: 24),
        OutlinedButton.icon(
          onPressed: () => ref.read(sessionControllerProvider.notifier).signOut(),
          icon: const Icon(Icons.logout),
          label: const Text('Sign out'),
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.red,
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
        ),
      ],
    );
  }
}
