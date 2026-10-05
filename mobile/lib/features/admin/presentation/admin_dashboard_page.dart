import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/session_controller.dart';
import '../../../core/theme/app_theme.dart';
import 'tabs/approvals_tab.dart';
import 'tabs/fleet_tab.dart';
import 'tabs/monitor_tab.dart';
import 'tabs/overview_tab.dart';
import 'tabs/shipments_tab.dart';
import 'tabs/users_tab.dart';

class _Section {
  const _Section(this.title, this.icon, this.page);
  final String title;
  final IconData icon;
  final Widget page;
}

/// ADMIN/ops home: a navigation drawer across the six ops sections, with the
/// Overview dashboard as the landing. Each section is built in its own phase.
class AdminDashboardPage extends ConsumerStatefulWidget {
  const AdminDashboardPage({super.key});

  @override
  ConsumerState<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends ConsumerState<AdminDashboardPage> {
  int _index = 0;

  static const _sections = [
    _Section('Overview', Icons.dashboard_outlined, OverviewTab()),
    _Section('Approvals', Icons.verified_outlined, ApprovalsTab()),
    _Section('Agent Monitor', Icons.insights_outlined, MonitorTab()),
    _Section('Shipments', Icons.local_shipping_outlined, ShipmentsTab()),
    _Section('Fleet', Icons.directions_car_outlined, FleetTab()),
    _Section('Users', Icons.people_outline, UsersTab()),
  ];

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(sessionControllerProvider).user;

    return Scaffold(
      appBar: AppBar(title: Text(_sections[_index].title)),
      drawer: Drawer(
        child: SafeArea(
          child: Column(
            children: [
              DrawerHeader(
                decoration: const BoxDecoration(color: AppTheme.navy),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Row(children: [
                      Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(11)),
                          child: const Icon(Icons.local_shipping_rounded,
                              color: Colors.white, size: 22)),
                      const SizedBox(width: 10),
                      const Text('LogiFlow Ops',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w800)),
                    ]),
                    const SizedBox(height: 12),
                    Text(user?.name ?? 'Admin',
                        style: const TextStyle(color: Colors.white70)),
                    Text(user?.email ?? '',
                        style: const TextStyle(
                            color: Colors.white54, fontSize: 12)),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    for (var i = 0; i < _sections.length; i++)
                      ListTile(
                        leading: Icon(_sections[i].icon),
                        title: Text(_sections[i].title),
                        selected: i == _index,
                        selectedColor: AppTheme.navy,
                        selectedTileColor:
                            AppTheme.orange.withValues(alpha: 0.09),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 18),
                        minLeadingWidth: 28,
                        onTap: () {
                          setState(() => _index = i);
                          Navigator.pop(context);
                        },
                      ),
                  ],
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title:
                    const Text('Sign out', style: TextStyle(color: Colors.red)),
                onTap: () =>
                    ref.read(sessionControllerProvider.notifier).signOut(),
              ),
            ],
          ),
        ),
      ),
      body: IndexedStack(
          index: _index, children: [for (final s in _sections) s.page]),
    );
  }
}
