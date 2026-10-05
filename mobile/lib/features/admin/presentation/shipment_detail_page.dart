import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/loading_state.dart';
import '../../../core/widgets/status_badge.dart';
import '../data/models/tracking_view.dart';
import 'controllers/admin_providers.dart';

/// Admin view of a shipment's full tracking timeline (all stops).
class ShipmentDetailPage extends ConsumerWidget {
  const ShipmentDetailPage(
      {super.key, required this.shipmentId, required this.shipmentCode});
  final String shipmentId;
  final String shipmentCode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(shipmentTrackingProvider(shipmentId));

    return Scaffold(
      appBar: AppBar(title: Text(shipmentCode)),
      body: async.when(
        loading: () => const LoadingState(label: 'Loading shipment…'),
        error: (e, _) => EmptyState(
          icon: Icons.cloud_off_outlined,
          title: "Couldn't load this shipment",
          message: 'Check your connection and try again.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(shipmentTrackingProvider(shipmentId)),
        ),
        data: (t) => RefreshIndicator(
          onRefresh: () async =>
              ref.invalidate(shipmentTrackingProvider(shipmentId)),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _header(t),
              const SizedBox(height: 12),
              _stopsCard(t),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _header(TrackingView t) => Card(
        color: AppTheme.navy,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  t.shipmentCode,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 8),
              StatusBadge(t.status),
            ],
          ),
        ),
      );

  Widget _stopsCard(TrackingView t) {
    final stops = [...t.stops]
      ..sort((a, b) => a.sequence.compareTo(b.sequence));
    final delivered = stops.where((s) => s.status == 'Delivered').length;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Text('STOPS',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.black54,
                    letterSpacing: 0.5)),
            const Spacer(),
            Text('$delivered/${stops.length} delivered',
                style: const TextStyle(color: Colors.black54, fontSize: 12)),
          ]),
          const SizedBox(height: 8),
          if (stops.isEmpty)
            const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text('No stops on this shipment.',
                    style: TextStyle(color: Colors.black54)))
          else
            for (final s in stops) _stopRow(s),
        ]),
      ),
    );
  }

  Widget _stopRow(TimelineEntry s) {
    final done = s.status == 'Delivered';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        CircleAvatar(
          radius: 12,
          backgroundColor: done ? Colors.green : AppTheme.navy,
          child: done
              ? const Icon(Icons.check, size: 14, color: Colors.white)
              : Text('${s.sequence}',
                  style: const TextStyle(color: Colors.white, fontSize: 12)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(s.address,
                style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 5),
            StatusBadge(s.status),
            const SizedBox(height: 2),
            Text(
              'ETA ${DateFormat('d MMM, h:mm a').format(s.plannedEta)}'
              '${s.actualAt != null ? ' · actual ${DateFormat('h:mm a').format(s.actualAt!)}' : ''}'
              '${s.distanceFromPrevKm > 0 ? ' · ${s.distanceFromPrevKm.toStringAsFixed(1)} km' : ''}',
              style: const TextStyle(color: Colors.black54, fontSize: 12),
            ),
            if (s.recipientName != null && s.recipientName!.isNotEmpty)
              Text('To: ${s.recipientName}',
                  style: const TextStyle(color: Colors.black45, fontSize: 12)),
            if (s.onTime != null)
              Text(s.onTime! ? 'On time' : 'Off window',
                  style: TextStyle(
                      fontSize: 12,
                      color: s.onTime! ? Colors.green : Colors.orange)),
          ]),
        ),
      ]),
    );
  }
}
