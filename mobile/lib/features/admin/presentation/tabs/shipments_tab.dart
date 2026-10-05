import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_state.dart';
import '../../../../core/widgets/status_badge.dart';
import '../../data/models/admin_shipment.dart';
import '../controllers/admin_providers.dart';
import '../shipment_detail_page.dart';

/// All dispatched shipments with an active/delivered filter.
class ShipmentsTab extends ConsumerStatefulWidget {
  const ShipmentsTab({super.key});

  @override
  ConsumerState<ShipmentsTab> createState() => _ShipmentsTabState();
}

class _ShipmentsTabState extends ConsumerState<ShipmentsTab> {
  static const _filters = ['All', 'Active', 'Delivered'];
  String _filter = 'All';

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(shipmentsProvider);

    return Column(
      children: [
        SizedBox(
          height: 52,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            children: [
              for (final f in _filters)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                      label: Text(f),
                      selected: _filter == f,
                      onSelected: (_) => setState(() => _filter = f)),
                ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => ref.invalidate(shipmentsProvider),
            child: async.when(
              loading: () => const LoadingState(label: 'Loading shipments…'),
              error: (e, _) => EmptyState(
                icon: Icons.cloud_off_outlined,
                title: 'Shipments unavailable',
                message: 'Check the connection and try again.',
                actionLabel: 'Retry',
                onAction: () => ref.invalidate(shipmentsProvider),
              ),
              data: (all) {
                final list = switch (_filter) {
                  'Active' => all.where((s) => s.isActive).toList(),
                  'Delivered' =>
                    all.where((s) => s.status == 'Delivered').toList(),
                  _ => all,
                };
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.local_shipping_outlined,
                    title: _filter == 'All'
                        ? 'No shipments yet'
                        : 'No $_filter shipments',
                    message: 'Dispatched shipments will appear here.',
                  );
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _ShipmentRow(shipment: list[i]),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _ShipmentRow extends StatelessWidget {
  const _ShipmentRow({required this.shipment});
  final AdminShipment shipment;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(
              builder: (_) => ShipmentDetailPage(
                  shipmentId: shipment.id,
                  shipmentCode: shipment.shipmentCode)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                    child: Text(shipment.shipmentCode,
                        style: const TextStyle(fontWeight: FontWeight.bold))),
                StatusBadge(shipment.status),
              ]),
              const SizedBox(height: 8),
              Row(children: [
                const Icon(Icons.check_circle_outline,
                    size: 15, color: Colors.black45),
                const SizedBox(width: 4),
                Text(
                    '${shipment.deliveredCount}/${shipment.stopCount} delivered',
                    style:
                        const TextStyle(color: Colors.black54, fontSize: 13)),
                const SizedBox(width: 12),
                const Icon(Icons.route, size: 15, color: Colors.black45),
                const SizedBox(width: 4),
                Text('${shipment.totalDistanceKm.toStringAsFixed(1)} km',
                    style:
                        const TextStyle(color: Colors.black54, fontSize: 13)),
                const Spacer(),
                if (shipment.dispatchedAt != null)
                  Text(DateFormat('d MMM').format(shipment.dispatchedAt!),
                      style:
                          const TextStyle(color: Colors.black45, fontSize: 12)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
