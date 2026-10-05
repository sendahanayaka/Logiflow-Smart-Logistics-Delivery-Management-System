import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/session_controller.dart';
import '../../../core/theme/app_theme.dart';

/// Reference feature screen — follow this pattern (ConsumerStatefulWidget +
/// a controller/repository provider) for the other features.
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});
  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
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
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref
          .read(sessionControllerProvider.notifier)
          .signIn(_email.text.trim(), _password.text);
      // On success the session changes and the router redirects to the role home.
    } catch (e) {
      setState(() => _error =
          friendlyError(e, 'Login failed. Check your email and password.'));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFECEBFA), AppTheme.canvas],
              stops: [0, 0.55]),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Center(
                      child: Container(
                        width: 68,
                        height: 68,
                        decoration: BoxDecoration(
                            color: AppTheme.navy,
                            borderRadius: BorderRadius.circular(22)),
                        child: const Icon(Icons.local_shipping_rounded,
                            size: 34, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text('LogiFlow',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineMedium),
                    const SizedBox(height: 6),
                    Text('Smart logistics, moving together.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context)
                            .textTheme
                            .bodyMedium
                            ?.copyWith(color: AppTheme.muted)),
                    const SizedBox(height: 28),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(22),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text('Welcome back',
                                style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 4),
                            Text('Sign in to continue to your workspace.',
                                style: Theme.of(context).textTheme.bodySmall),
                            const SizedBox(height: 22),
                            TextField(
                                controller: _email,
                                decoration: const InputDecoration(
                                    labelText: 'Email',
                                    prefixIcon: Icon(Icons.mail_outline)),
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next),
                            const SizedBox(height: 14),
                            TextField(
                                controller: _password,
                                decoration: const InputDecoration(
                                    labelText: 'Password',
                                    prefixIcon: Icon(Icons.lock_outline)),
                                obscureText: true,
                                textInputAction: TextInputAction.done,
                                onSubmitted: (_) {
                                  if (!_loading) _submit();
                                }),
                            if (_error != null) ...[
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                    color: const Color(0xFFFCE8EC),
                                    borderRadius: BorderRadius.circular(10)),
                                child: Row(children: [
                                  const Icon(Icons.error_outline,
                                      color: AppTheme.danger, size: 19),
                                  const SizedBox(width: 8),
                                  Expanded(
                                      child: Text(_error!,
                                          style: const TextStyle(
                                              color: AppTheme.danger,
                                              fontWeight: FontWeight.w600)))
                                ]),
                              ),
                            ],
                            const SizedBox(height: 20),
                            FilledButton(
                                onPressed: _loading ? null : _submit,
                                child: _loading
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white))
                                    : const Text('Sign in')),
                            const SizedBox(height: 8),
                            TextButton(
                                onPressed: () => context.push('/register'),
                                child: const Text(
                                    "Don't have an account? Register")),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Pull a readable message out of a Dio error ({message}/{title}/validation).
String friendlyError(Object e, String fallback) {
  if (e is DioException) {
    if (e.response == null && e.type == DioExceptionType.cancel) {
      return 'Sign-in request was cancelled. Please try again.';
    }
    if (e.response == null) {
      return 'Cannot reach the LogiFlow server. Make sure the backend is running and try again.';
    }
    final data = e.response?.data;
    if (data is Map) {
      if (data['message'] is String) return data['message'] as String;
      if (data['title'] is String) return data['title'] as String;
      if (data['errors'] is Map) {
        return (data['errors'] as Map)
            .values
            .expand((v) => v is List ? v : [v])
            .join(' ');
      }
    }
    return 'Request failed (HTTP ${e.response?.statusCode ?? '?'}).';
  }
  return fallback;
}
