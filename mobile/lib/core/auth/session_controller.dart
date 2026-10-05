import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/token_store.dart';
import '../../features/auth/data/auth_repository.dart';
import 'auth_user.dart';

/// Current authentication state for the whole app.
class SessionState {
  const SessionState({this.user, this.loading = false});
  final AuthUser? user;
  final bool loading;
  bool get isAuthenticated => user != null;
}

/// Owns sign-in / register / sign-out and restores the session on launch.
class SessionController extends Notifier<SessionState> {
  @override
  SessionState build() {
    _restore();
    return const SessionState(loading: true);
  }

  Future<void> _restore() async {
    final store = ref.read(tokenStoreProvider);
    final token = await store.read();
    if (token == null || token.isEmpty) {
      state = const SessionState(loading: false);
      return;
    }
    try {
      final user = await ref.read(authRepositoryProvider).me();
      state = SessionState(user: user, loading: false);
    } catch (_) {
      await store.clear();
      state = const SessionState(loading: false);
    }
  }

  Future<void> signIn(String email, String password) async {
    final res = await ref.read(authRepositoryProvider).login(email, password);
    await ref.read(tokenStoreProvider).write(res.token);
    state = SessionState(user: res.user, loading: false);
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final res = await ref
        .read(authRepositoryProvider)
        .register(name: name, email: email, password: password);
    await ref.read(tokenStoreProvider).write(res.token);
    state = SessionState(user: res.user, loading: false);
  }

  Future<void> signOut() async {
    await ref.read(tokenStoreProvider).clear();
    state = const SessionState(loading: false);
  }
}

final sessionControllerProvider =
    NotifierProvider<SessionController, SessionState>(SessionController.new);
