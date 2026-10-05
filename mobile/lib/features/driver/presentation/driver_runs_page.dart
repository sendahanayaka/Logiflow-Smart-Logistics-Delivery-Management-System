import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/widgets/role_scaffold.dart';
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
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => ListView(
            padding: const EdgeInsets.all(24),
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  'Failed to load runs: $err',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: ElevatedButton.icon(
                  onPressed: () => ref.invalidate(driverRunsProvider),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Retry'),
                ),
              ),
            ],
          ),
          data: (runs) {
            if (runs.isEmpty) {
              return ListView(
                padding: const EdgeInsets.all(32),
                children: const [
                  SizedBox(height: 60),
                  Icon(Icons.local_shipping_outlined, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Center(
                    child: Text(
                      'No delivery runs assigned.',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey),
                    ),
                  ),
                  SizedBox(height: 8),
                  Center(
                    child: Text(
                      'Pull down to refresh when new dispatches are assigned.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey),
                    ),
                  ),
                ],
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

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'dispatched':
      case 'in_transit':
      case 'intransit':
        return Colors.blue;
      case 'completed':
      case 'delivered':
        return Colors.green;
      case 'created':
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = run.stopCount > 0 ? (run.deliveredCount / run.stopCount) : 0.0;
    final statusColor = _statusColor(run.status);

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                  Row(
                    children: [
                      const Icon(Icons.route, color: Colors.indigo),
                      const SizedBox(width: 8),
                      Text(
                        run.shipmentCode.isNotEmpty ? run.shipmentCode : 'Run #${run.id.substring(0, 8)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                    ),
                    child: Text(
                      run.status.toUpperCase(),
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
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
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 6,
                            backgroundColor: Colors.grey.shade200,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              progress == 1.0 ? Colors.green : Colors.indigo,
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
                      const Icon(Icons.straighten, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${run.totalDistanceKm.toStringAsFixed(1)} km total',
                        style: const TextStyle(fontSize: 13, color: Colors.black87),
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
