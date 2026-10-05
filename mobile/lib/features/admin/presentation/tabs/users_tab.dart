import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/admin_repository.dart';
import '../../data/models/app_user.dart';
import '../controllers/admin_providers.dart';
import '../user_form_page.dart';

/// User management: list accounts, create new users, change role, activate/deactivate.
class UsersTab extends ConsumerWidget {
  const UsersTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(usersProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(usersProvider),
        child: async.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [
            const SizedBox(height: 120),
            const Center(child: Text("Couldn't load users.")),
            const SizedBox(height: 12),
            Center(child: OutlinedButton(onPressed: () => ref.invalidate(usersProvider), child: const Text('Retry'))),
          ]),
          data: (users) {
            if (users.isEmpty) {
              return ListView(children: const [SizedBox(height: 120), Center(child: Text('No users yet.'))]);
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
              itemCount: users.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _UserCard(user: users[i]),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final ok = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => const UserFormPage()));
          if (ok == true) ref.invalidate(usersProvider);
        },
        icon: const Icon(Icons.person_add),
        label: const Text('Add user'),
      ),
    );
  }
}

class _UserCard extends ConsumerWidget {
  const _UserCard({required this.user});
  final AppUser user;

  Future<void> _changeRole(BuildContext context, WidgetRef ref) async {
    final roles = ref.read(rolesProvider).valueOrNull;
    if (roles == null || roles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Roles still loading — try again.')));
      return;
    }
    var selected = user.roleId;
    final chosen = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Change role'),
        content: StatefulBuilder(
          builder: (ctx, setLocal) => DropdownButton<String>(
            isExpanded: true,
            value: roles.any((r) => r.id == selected) ? selected : null,
            items: [for (final r in roles) DropdownMenuItem(value: r.id, child: Text(r.name))],
            onChanged: (v) => setLocal(() => selected = v ?? selected),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, selected), child: const Text('Save')),
        ],
      ),
    );
    if (chosen == null || chosen == user.roleId) return;
    try {
      await ref.read(adminRepositoryProvider).changeRole(user.id, chosen);
      ref.invalidate(usersProvider);
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not change role.')));
      }
    }
  }

  Future<void> _toggleStatus(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(adminRepositoryProvider).setStatus(user.id, !user.isActive);
      ref.invalidate(usersProvider);
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not update status.')));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        leading: CircleAvatar(child: Text(user.name.isNotEmpty ? user.name[0].toUpperCase() : '?')),
        title: Text(user.name),
        subtitle: Text('${user.email}\n${user.role}'),
        isThreeLine: true,
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: user.isActive ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(user.isActive ? 'Active' : 'Inactive',
                style: TextStyle(
                    color: user.isActive ? const Color(0xFF166534) : const Color(0xFF991B1B),
                    fontSize: 11,
                    fontWeight: FontWeight.w600)),
          ),
          PopupMenuButton<String>(
            onSelected: (c) {
              if (c == 'role') _changeRole(context, ref);
              if (c == 'status') _toggleStatus(context, ref);
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'role', child: Text('Change role')),
              PopupMenuItem(value: 'status', child: Text(user.isActive ? 'Deactivate' : 'Activate')),
            ],
          ),
        ]),
      ),
    );
  }
}
