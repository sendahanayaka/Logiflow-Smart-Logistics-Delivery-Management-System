import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/models/warehouse_models.dart';
import '../data/warehouse_repository.dart';
import 'warehouse_error.dart';

/// Entry point for Warehouse Staff and Admin package intake.
class WarehouseHomePage extends ConsumerStatefulWidget {
  const WarehouseHomePage({super.key});

  @override
  ConsumerState<WarehouseHomePage> createState() => _WarehouseHomePageState();
}

class _WarehouseHomePageState extends ConsumerState<WarehouseHomePage> {
  late Future<List<Warehouse>> _warehouses;

  @override
  void initState() {
    super.initState();
    _warehouses = _loadWarehouses();
  }

  Future<List<Warehouse>> _loadWarehouses() =>
      ref.read(warehouseRepositoryProvider).getWarehouses();

  void _retry() => setState(() => _warehouses = _loadWarehouses());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Warehouse intake')),
      body: FutureBuilder<List<Warehouse>>(
        future: _warehouses,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _WarehouseMessage(
              message: warehouseErrorMessage(snapshot.error!,
                  fallback: 'Unable to load warehouses.'),
              actionLabel: 'Retry',
              onAction: _retry,
            );
          }
          final warehouses = snapshot.data ?? const <Warehouse>[];
          if (warehouses.isEmpty) {
            return const _WarehouseMessage(
                message: 'No warehouses are available for package intake.');
          }
          return RefreshIndicator(
            onRefresh: () async => _retry(),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: warehouses.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final warehouse = warehouses[index];
                return Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                        child: Icon(Icons.warehouse_outlined)),
                    title: Text(warehouse.name),
                    subtitle: Text(
                        '${warehouse.location}\n${warehouse.occupiedVolumeM3.toStringAsFixed(2)} / '
                        '${warehouse.totalVolumeM3.toStringAsFixed(2)} m³ occupied'),
                    isThreeLine: true,
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push(
                        '/warehouse/${warehouse.id}/intake',
                        extra: warehouse),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _WarehouseMessage extends StatelessWidget {
  const _WarehouseMessage(
      {required this.message, this.actionLabel, this.onAction});

  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, textAlign: TextAlign.center),
              if (actionLabel != null) ...[
                const SizedBox(height: 12),
                OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
              ],
            ],
          ),
        ),
      );
}
