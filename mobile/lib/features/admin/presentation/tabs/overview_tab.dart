import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_theme.dart';
import '../controllers/admin_providers.dart';

/// Ops overview: headline counts across workflows, shipments and fleet.
class OverviewTab extends ConsumerWidget {
  const OverviewTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workflows = ref.watch(workflowsProvider(null));
    final shipments = ref.watch(shipmentsProvider);
    final drivers = ref.watch(driversProvider);
    final vehicles = ref.watch(vehiclesProvider);

    Future<void> refresh() async {
      ref.invalidate(workflowsProvider(null));
      ref.invalidate(shipmentsProvider);
      ref.invalidate(driversProvider);
      ref.invalidate(vehiclesProvider);
    }

    // Workflows + shipments drive the primary tiles; fleet is a best-effort snapshot.
    if (workflows.isLoading || shipments.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (workflows.hasError || shipments.hasError) {
      return RefreshIndicator(
        onRefresh: refresh,
        child: ListView(children: [
          const SizedBox(height: 120),
          const Center(child: Text("Couldn't load the dashboard. Is the API running?")),
          const SizedBox(height: 12),
          Center(child: OutlinedButton(onPressed: refresh, child: const Text('Retry'))),
        ]),
      );
    }

    final wfs = workflows.valueOrNull ?? const [];
    final shs = shipments.valueOrNull ?? const [];
    final pendingApprovals = wfs.where((w) => w.isAwaitingApproval).length;
    final activeShipments = shs.where((s) => s.isActive).length;
    final delivered = shs.where((s) => s.status == 'Delivered').length;

    final tiles = <Widget>[
      _StatTile(label: 'Pending approvals', value: '$pendingApprovals', accent: true),
      _StatTile(label: 'Workflows total', value: '${wfs.length}'),
      _StatTile(label: 'Active shipments', value: '$activeShipments'),
      _StatTile(label: 'Delivered', value: '$delivered'),
      _StatTile(label: 'Drivers', value: '${drivers.valueOrNull?.length ?? '—'}'),
      _StatTile(label: 'Vehicles', value: '${vehicles.valueOrNull?.length ?? '—'}'),
    ];

    return RefreshIndicator(
      onRefresh: refresh,
      child: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.5,
        children: tiles,
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value, this.accent = false});
  final String label;
  final String value;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: accent ? AppTheme.orange : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value,
                style: TextStyle(
                    fontSize: 32, fontWeight: FontWeight.bold, color: accent ? Colors.white : AppTheme.navy)),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: accent ? Colors.white : Colors.black54)),
          ],
        ),
      ),
    );
  }
}
