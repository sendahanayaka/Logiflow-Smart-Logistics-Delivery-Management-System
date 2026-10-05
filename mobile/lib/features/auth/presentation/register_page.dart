import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/session_controller.dart';
import 'login_page.dart' show friendlyError, emailError, requiredError;

/// Public registration is CUSTOMER-only. ADMIN, DRIVER and WAREHOUSE_STAFF are
/// created by an admin via the Users API, so no role is chosen here.
class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});
  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
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
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(sessionControllerProvider.notifier).register(
            name: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
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
            child: Form(
              key: _formKey,
              autovalidateMode: AutovalidateMode.onUserInteraction,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Create a customer account',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _name,
                    decoration: const InputDecoration(labelText: 'Full name'),
                    textInputAction: TextInputAction.next,
                    validator: (v) => requiredError(v, 'Full name'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _email,
                    decoration: const InputDecoration(labelText: 'Email'),
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    validator: emailError,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _password,
                    decoration: const InputDecoration(labelText: 'Password'),
                    obscureText: true,
                    validator: (v) => (v == null || v.length < 6)
                        ? 'Password must be at least 6 characters.'
                        : null,
                  ),
                  const SizedBox(height: 8),
                  if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _loading ? null : _submit,
                    child: Text(_loading ? 'Creating…' : 'Create account'),
                  ),
                  TextButton(onPressed: () => context.pop(), child: const Text('Back to login')),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
