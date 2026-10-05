import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/sign_out_button.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/loading_state.dart';
import '../../../core/theme/app_theme.dart';
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
      appBar: AppBar(
        title: const Text('Warehouses'),
        actions: const [SignOutButton()],
      ),
      body: FutureBuilder<List<Warehouse>>(
        future: _warehouses,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const LoadingState(label: 'Loading warehouses…');
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
            return const EmptyState(
              icon: Icons.warehouse_outlined,
              title: 'No warehouses available',
              message:
                  'Warehouses will appear here when they are ready for intake.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => _retry(),
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 28),
              itemCount: warehouses.length + 1,
              separatorBuilder: (_, index) =>
                  SizedBox(height: index == 0 ? 18 : 12),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Choose a warehouse',
                          style: Theme.of(context).textTheme.headlineSmall),
                      const SizedBox(height: 6),
                      Text(
                          'Select a location to receive and place incoming packages.',
                          style: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.copyWith(color: AppTheme.muted)),
                    ],
                  );
                }
                final warehouse = warehouses[index - 1];
                final capacity = warehouse.totalVolumeM3 <= 0
                    ? 0.0
                    : (warehouse.occupiedVolumeM3 / warehouse.totalVolumeM3)
                        .clamp(0.0, 1.0);
                return Card(
                  child: InkWell(
                    onTap: () => context.push(
                        '/warehouse/${warehouse.id}/manage',
                        extra: warehouse),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                        color: AppTheme.navy
                                            .withValues(alpha: 0.07),
                                        borderRadius:
                                            BorderRadius.circular(12)),
                                    child: const Icon(Icons.warehouse_outlined,
                                        color: AppTheme.navy)),
                                const SizedBox(width: 12),
                                Expanded(
                                    child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                      Text(warehouse.name,
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleMedium),
                                      const SizedBox(height: 4),
                                      Text(warehouse.location,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall),
                                    ])),
                                const Icon(Icons.chevron_right,
                                    color: AppTheme.muted),
                              ]),
                          const SizedBox(height: 18),
                          Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Storage capacity',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelMedium
                                        ?.copyWith(
                                            color: AppTheme.muted,
                                            fontWeight: FontWeight.w600)),
                                Text(
                                    '${warehouse.occupiedVolumeM3.toStringAsFixed(1)} / ${warehouse.totalVolumeM3.toStringAsFixed(1)} m³',
                                    style: Theme.of(context)
                                        .textTheme
                                        .labelMedium
                                        ?.copyWith(
                                            color: AppTheme.navy,
                                            fontWeight: FontWeight.w700)),
                              ]),
                          const SizedBox(height: 8),
                          ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: LinearProgressIndicator(
                                  value: capacity,
                                  minHeight: 7,
                                  backgroundColor: AppTheme.border,
                                  valueColor: AlwaysStoppedAnimation(
                                      capacity >= 0.9
                                          ? AppTheme.warning
                                          : AppTheme.orange))),
                        ],
                      ),
                    ),
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
  Widget build(BuildContext context) => EmptyState(
        icon: Icons.cloud_off_outlined,
        title: 'Could not load warehouses',
        message: message,
        actionLabel: actionLabel,
        onAction: onAction,
      );
}
