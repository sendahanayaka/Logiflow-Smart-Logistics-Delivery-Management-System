import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_state.dart';
import '../../../../core/widgets/status_badge.dart';
import '../../data/admin_repository.dart';
import '../../data/models/fleet.dart';
import '../controllers/admin_providers.dart';
import '../driver_form_page.dart';
import '../vehicle_form_page.dart';

/// Fleet management: drivers + vehicles, each with list + create/edit (+ delete
/// for vehicles).
class FleetTab extends ConsumerStatefulWidget {
  const FleetTab({super.key});

  @override
  ConsumerState<FleetTab> createState() => _FleetTabState();
}

class _FleetTabState extends ConsumerState<FleetTab>
    with SingleTickerProviderStateMixin {
  late final TabController _tab = TabController(length: 2, vsync: this)
    ..addListener(() => setState(() {}));

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _addDriver() async {
    final ok = await Navigator.of(context)
        .push<bool>(MaterialPageRoute(builder: (_) => const DriverFormPage()));
    if (ok == true) ref.invalidate(driversProvider);
  }

  Future<void> _addVehicle() async {
    final ok = await Navigator.of(context)
        .push<bool>(MaterialPageRoute(builder: (_) => const VehicleFormPage()));
    if (ok == true) ref.invalidate(vehiclesProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          TabBar(
              controller: _tab,
              tabs: const [Tab(text: 'Drivers'), Tab(text: 'Vehicles')]),
          Expanded(
            child: TabBarView(
              controller: _tab,
              children: const [_DriversList(), _VehiclesList()],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'admin-fleet-add',
        onPressed: _tab.index == 0 ? _addDriver : _addVehicle,
        icon: const Icon(Icons.add),
        label: Text(_tab.index == 0 ? 'Add driver' : 'Add vehicle'),
      ),
    );
  }
}

class _DriversList extends ConsumerWidget {
  const _DriversList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(driversProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(driversProvider),
      child: async.when(
        loading: () => const LoadingState(label: 'Loading drivers…'),
        error: (e, _) => _error(() => ref.invalidate(driversProvider)),
        data: (drivers) {
          if (drivers.isEmpty) return _empty('No drivers yet.');
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
            itemCount: drivers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final d = drivers[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: CircleAvatar(
                      child: Text(d.fullName.isNotEmpty
                          ? d.fullName[0].toUpperCase()
                          : '?')),
                  title: Text(d.fullName),
                  subtitle: Text(
                      '${d.licenseNumber}${d.phoneNumber != null ? ' · ${d.phoneNumber}' : ''}'),
                  trailing: _statusPill(d.statusLabel),
                  onTap: () async {
                    final ok = await Navigator.of(context).push<bool>(
                      MaterialPageRoute(
                          builder: (_) => DriverFormPage(driver: d)),
                    );
                    if (ok == true) ref.invalidate(driversProvider);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _VehiclesList extends ConsumerWidget {
  const _VehiclesList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(vehiclesProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(vehiclesProvider),
      child: async.when(
        loading: () => const LoadingState(label: 'Loading vehicles…'),
        error: (e, _) => _error(() => ref.invalidate(vehiclesProvider)),
        data: (vehicles) {
          if (vehicles.isEmpty) return _empty('No vehicles yet.');
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
            itemCount: vehicles.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final v = vehicles[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading:
                      const CircleAvatar(child: Icon(Icons.local_shipping)),
                  title: Text('${v.registrationNumber} · ${v.vehicleType}'),
                  subtitle: Text(
                      '${v.make} ${v.model} · ${v.capacity.toStringAsFixed(0)} kg'),
                  trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                    _statusPill(v.statusLabel),
                    PopupMenuButton<String>(
                      onSelected: (choice) async {
                        if (choice == 'edit') {
                          final ok = await Navigator.of(context).push<bool>(
                            MaterialPageRoute(
                                builder: (_) => VehicleFormPage(vehicle: v)),
                          );
                          if (ok == true) ref.invalidate(vehiclesProvider);
                        } else if (choice == 'delete') {
                          await _confirmDelete(context, ref, v);
                        }
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'edit', child: Text('Edit')),
                        PopupMenuItem(
                            value: 'delete',
                            child: Text('Delete',
                                style: TextStyle(color: Colors.red))),
                      ],
                    ),
                  ]),
                  onTap: () async {
                    final ok = await Navigator.of(context).push<bool>(
                      MaterialPageRoute(
                          builder: (_) => VehicleFormPage(vehicle: v)),
                    );
                    if (ok == true) ref.invalidate(vehiclesProvider);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, Vehicle v) async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete vehicle?'),
        content: Text('Remove ${v.registrationNumber}? This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (yes != true) return;
    try {
      await ref.read(adminRepositoryProvider).deleteVehicle(v.id);
      ref.invalidate(vehiclesProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Vehicle deleted.')));
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('Could not delete — it may be assigned to a shipment.')),
        );
      }
    }
  }
}

Widget _statusPill(String label) => StatusBadge(label);

Widget _empty(String msg) =>
    EmptyState(icon: Icons.directions_car_outlined, title: msg);

Widget _error(VoidCallback retry) => EmptyState(
      icon: Icons.cloud_off_outlined,
      title: 'Fleet data unavailable',
      message: 'Check the connection and try again.',
      actionLabel: 'Retry',
      onAction: retry,
    );
