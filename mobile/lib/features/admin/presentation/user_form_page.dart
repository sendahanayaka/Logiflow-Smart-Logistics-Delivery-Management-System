import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/login_page.dart' show friendlyError;
import '../data/admin_repository.dart';
import 'controllers/admin_providers.dart';

/// Create a new user account (name, email, password, role). Roles come from
/// GET /users/roles.
class UserFormPage extends ConsumerStatefulWidget {
  const UserFormPage({super.key});

  @override
  ConsumerState<UserFormPage> createState() => _UserFormPageState();
}

class _UserFormPageState extends ConsumerState<UserFormPage> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _roleId;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _error = null);
    if (!_form.currentState!.validate()) return;
    if (_roleId == null) {
      setState(() => _error = 'Please select a role.');
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(adminRepositoryProvider).createUser({
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'password': _password.text,
        'roleId': _roleId,
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Could not create the user.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final rolesAsync = ref.watch(rolesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Add User')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _name,
              maxLength: 150,
              decoration: const InputDecoration(labelText: 'Full name', counterText: ''),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (v) {
                final t = (v ?? '').trim();
                if (t.isEmpty) return 'Email is required.';
                if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(t)) return 'Enter a valid email.';
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
              validator: (v) => (v == null || v.length < 6) ? 'Password must be at least 6 characters.' : null,
            ),
            const SizedBox(height: 12),
            rolesAsync.when(
              loading: () => const LinearProgressIndicator(),
              error: (e, _) => const Text('Could not load roles.', style: TextStyle(color: Colors.red)),
              data: (roles) => DropdownButtonFormField<String>(
                initialValue: _roleId,
                decoration: const InputDecoration(labelText: 'Role'),
                items: [for (final r in roles) DropdownMenuItem(value: r.id, child: Text(r.name))],
                onChanged: (v) => setState(() => _roleId = v),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.person_add),
              label: Text(_saving ? 'Creating…' : 'Create user'),
            ),
          ],
        ),
      ),
    );
  }
}
