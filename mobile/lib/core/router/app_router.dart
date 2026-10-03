import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/session_controller.dart';
import '../auth/user_role.dart';
import '../../features/auth/presentation/login_page.dart';
import '../../features/auth/presentation/register_page.dart';
import '../../features/admin/presentation/admin_dashboard_page.dart';
import '../../features/customer/presentation/customer_home_page.dart';
import '../../features/warehouse/presentation/warehouse_home_page.dart';
import '../../features/driver/presentation/driver_runs_page.dart';

String homePathFor(UserRole role) {
  switch (role) {
    case UserRole.admin:
      return '/admin';
    case UserRole.customer:
      return '/customer';
    case UserRole.warehouseStaff:
      return '/warehouse';
    case UserRole.driver:
      return '/driver';
    case UserRole.unknown:
      return '/login';
  }
}

final appRouterProvider = Provider<GoRouter>((ref) {
  // Rebuild routing whenever the session changes (sign in/out, restore).
  final refresh = ValueNotifier<int>(0);
  ref.listen(sessionControllerProvider, (_, __) => refresh.value++);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final session = ref.read(sessionControllerProvider);
      final loc = state.matchedLocation;

      if (session.loading) return loc == '/' ? null : '/';

      final onAuthPage = loc == '/login' || loc == '/register';
      if (!session.isAuthenticated) {
        return onAuthPage ? null : '/login';
      }

      // Authenticated: push away from the splash/auth pages to the role home.
      final home = homePathFor(session.user!.role);
      if (loc == '/' || onAuthPage) return home;
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const _SplashPage()),
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterPage()),
      GoRoute(path: '/admin', builder: (_, __) => const AdminDashboardPage()),
      GoRoute(path: '/customer', builder: (_, __) => const CustomerHomePage()),
      GoRoute(path: '/warehouse', builder: (_, __) => const WarehouseHomePage()),
      GoRoute(path: '/driver', builder: (_, __) => const DriverRunsPage()),
    ],
  );
});

class _SplashPage extends StatelessWidget {
  const _SplashPage();
  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: CircularProgressIndicator()));
}
