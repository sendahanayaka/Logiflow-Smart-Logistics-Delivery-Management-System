import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/widgets/role_scaffold.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/loading_state.dart';
import '../../../core/widgets/status_badge.dart';
import '../../../core/theme/app_theme.dart';
import '../data/driver_repository.dart';
import '../data/models/driver_models.dart';

class DriverRunsPage extends ConsumerWidget {
  const DriverRunsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final runsAsync = ref.watch(driverRunsProvider);

    return RoleScaffold(
      title: 'My Delivery Runs',
      owner: 'Driver Team',
      todo: const ['My Runs List', 'Run Detail Timeline', 'POD Submission'],
      child: RefreshIndicator(
        onRefresh: () async => ref.invalidate(driverRunsProvider),
        child: runsAsync.when(
          loading: () => const LoadingState(label: 'Loading delivery runs…'),
          error: (err, stack) => EmptyState(
            icon: Icons.cloud_off_outlined,
            title: 'Runs are unavailable',
            message: 'Check your connection and try again.',
            actionLabel: 'Retry',
            onAction: () => ref.invalidate(driverRunsProvider),
          ),
          data: (runs) {
            if (runs.isEmpty) {
              return const EmptyState(
                icon: Icons.local_shipping_outlined,
                title: 'No delivery runs yet',
                message:
                    'Pull down to refresh when a new dispatch is assigned.',
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: runs.length,
              itemBuilder: (context, index) {
                final run = runs[index];
                return _RunCard(run: run);
              },
            );
          },
        ),
      ),
    );
  }
}

class _RunCard extends StatelessWidget {
  const _RunCard({required this.run});
  final ShipmentSummary run;

  @override
  Widget build(BuildContext context) {
    final progress =
        run.stopCount > 0 ? (run.deliveredCount / run.stopCount) : 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/driver/run/${run.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                      child: Row(
                    children: [
                      const Icon(Icons.route, color: AppTheme.navy),
                      const SizedBox(width: 8),
                      Expanded(
                          child: Text(
                        run.shipmentCode.isNotEmpty
                            ? run.shipmentCode
                            : 'Run #${run.id.substring(0, 8)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      )),
                    ],
                  )),
                  const SizedBox(width: 8),
                  StatusBadge(run.status, label: run.status.toUpperCase()),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Stops: ${run.deliveredCount} / ${run.stopCount} Delivered',
                          style: const TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 6,
                            backgroundColor: Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              progress == 1.0
                                  ? AppTheme.success
                                  : AppTheme.orange,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.straighten,
                          size: 16, color: AppTheme.muted),
                      const SizedBox(width: 4),
                      Text(
                        '${run.totalDistanceKm.toStringAsFixed(1)} km total',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  if (run.dispatchedAt != null)
                    Text(
                      'Dispatched: ${DateFormat('MMM d, HH:mm').format(run.dispatchedAt!)}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
