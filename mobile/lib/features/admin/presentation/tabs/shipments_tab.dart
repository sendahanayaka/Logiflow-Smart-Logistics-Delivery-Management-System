import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

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
                  child: ChoiceChip(label: Text(f), selected: _filter == f, onSelected: (_) => setState(() => _filter = f)),
                ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => ref.invalidate(shipmentsProvider),
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ListView(children: [
                const SizedBox(height: 120),
                const Center(child: Text("Couldn't load shipments.")),
                const SizedBox(height: 12),
                Center(child: OutlinedButton(onPressed: () => ref.invalidate(shipmentsProvider), child: const Text('Retry'))),
              ]),
              data: (all) {
                final list = switch (_filter) {
                  'Active' => all.where((s) => s.isActive).toList(),
                  'Delivered' => all.where((s) => s.status == 'Delivered').toList(),
                  _ => all,
                };
                if (list.isEmpty) {
                  return ListView(children: [
                    const SizedBox(height: 120),
                    Center(child: Text(_filter == 'All' ? 'No shipments yet.' : 'No $_filter shipments.',
                        style: const TextStyle(color: Colors.black54))),
                  ]);
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
    final delivered = shipment.status == 'Delivered';
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ShipmentDetailPage(shipmentId: shipment.id, shipmentCode: shipment.shipmentCode)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(shipment.shipmentCode, style: const TextStyle(fontWeight: FontWeight.bold))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: delivered ? const Color(0xFFDCFCE7) : const Color(0xFFE0E7FF),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(shipment.status,
                      style: TextStyle(
                          color: delivered ? const Color(0xFF166534) : const Color(0xFF3730A3),
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                ),
              ]),
              const SizedBox(height: 8),
              Row(children: [
                const Icon(Icons.check_circle_outline, size: 15, color: Colors.black45),
                const SizedBox(width: 4),
                Text('${shipment.deliveredCount}/${shipment.stopCount} delivered',
                    style: const TextStyle(color: Colors.black54, fontSize: 13)),
                const SizedBox(width: 12),
                const Icon(Icons.route, size: 15, color: Colors.black45),
                const SizedBox(width: 4),
                Text('${shipment.totalDistanceKm.toStringAsFixed(1)} km', style: const TextStyle(color: Colors.black54, fontSize: 13)),
                const Spacer(),
                if (shipment.dispatchedAt != null)
                  Text(DateFormat('d MMM').format(shipment.dispatchedAt!), style: const TextStyle(color: Colors.black45, fontSize: 12)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
