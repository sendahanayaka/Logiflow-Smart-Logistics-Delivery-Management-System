import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/session_controller.dart';

/// Reference feature screen — follow this pattern (ConsumerStatefulWidget +
/// a controller/repository provider) for the other features.
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
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
      await ref.read(sessionControllerProvider.notifier).signIn(_email.text.trim(), _password.text);
      // On success the session changes and the router redirects to the role home.
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Login failed. Check your email and password.'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                  const Text('📦 LogiFlow', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
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
                    validator: (v) => requiredError(v, 'Password'),
                  ),
                  const SizedBox(height: 8),
                  if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 12),
                  FilledButton(onPressed: _loading ? null : _submit, child: Text(_loading ? 'Signing in…' : 'Login')),
                  TextButton(onPressed: () => context.push('/register'), child: const Text("Don't have an account? Register")),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Shared form validators (used by login + register).
final _emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

String? emailError(String? value) {
  final v = (value ?? '').trim();
  if (v.isEmpty) return 'Email is required.';
  if (!_emailRegex.hasMatch(v)) return 'Enter a valid email address.';
  return null;
}

String? requiredError(String? value, String field) {
  if ((value ?? '').trim().isEmpty) return '$field is required.';
  return null;
}

/// Pull a readable message out of a Dio error ({message}/{title}/validation).
String friendlyError(Object e, String fallback) {
  if (e is DioException) {
    final data = e.response?.data;
    if (data is Map) {
      if (data['message'] is String) return data['message'] as String;
      if (data['title'] is String) return data['title'] as String;
      if (data['errors'] is Map) {
        return (data['errors'] as Map).values.expand((v) => v is List ? v : [v]).join(' ');
      }
    }
    return 'Request failed (HTTP ${e.response?.statusCode ?? '?'}).';
  }
  return fallback;
}
