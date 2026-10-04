import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/session_controller.dart';
import '../../../core/auth/user_role.dart';
import 'login_page.dart' show friendlyError;

/// Common auth screen. ADMIN is created via the API (not offered here).
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});
  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  UserRole _role = UserRole.customer;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(sessionControllerProvider.notifier).register(
            name: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
            roleId: _role.roleId,
          );
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Registration failed.'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name')),
                const SizedBox(height: 12),
                TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
                const SizedBox(height: 12),
                TextField(controller: _password, decoration: const InputDecoration(labelText: 'Password'), obscureText: true),
                const SizedBox(height: 12),
                DropdownButtonFormField<UserRole>(
                  initialValue: _role,
                  decoration: const InputDecoration(labelText: 'Role'),
                  items: const [
                    DropdownMenuItem(value: UserRole.customer, child: Text('Customer')),
                    DropdownMenuItem(value: UserRole.warehouseStaff, child: Text('Warehouse Staff')),
                    DropdownMenuItem(value: UserRole.driver, child: Text('Driver')),
                  ],
                  onChanged: (r) => setState(() => _role = r ?? UserRole.customer),
                ),
                const SizedBox(height: 8),
                if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 12),
                FilledButton(onPressed: _loading ? null : _submit, child: Text(_loading ? 'Creating…' : 'Create account')),
                TextButton(onPressed: () => context.pop(), child: const Text('Back to login')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
