import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/session_controller.dart';
import '../../../core/theme/app_theme.dart';
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
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(22),
                child: Form(
                  key: _formKey,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text('Create your account',
                          style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 5),
                      Text('Join LogiFlow to manage your deliveries and orders.',
                          style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(height: 22),
                      TextFormField(
                        controller: _name,
                        decoration: const InputDecoration(
                            labelText: 'Full name',
                            prefixIcon: Icon(Icons.person_outline)),
                        textInputAction: TextInputAction.next,
                        validator: (v) => requiredError(v, 'Full name'),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _email,
                        decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.mail_outline)),
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        validator: emailError,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _password,
                        decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.lock_outline)),
                        obscureText: true,
                        validator: (v) => (v == null || v.length < 6)
                            ? 'Password must be at least 6 characters.'
                            : null,
                      ),
                      const SizedBox(height: 8),
                      if (_error != null)
                        Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                                color: const Color(0xFFFCE8EC),
                                borderRadius: BorderRadius.circular(10)),
                            child: Text(_error!,
                                style: const TextStyle(
                                    color: AppTheme.danger,
                                    fontWeight: FontWeight.w600))),
                      const SizedBox(height: 12),
                      FilledButton(
                          onPressed: _loading ? null : _submit,
                          child: Text(_loading ? 'Creating…' : 'Create account')),
                      TextButton(
                          onPressed: () => context.pop(),
                          child: const Text('Back to login')),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
