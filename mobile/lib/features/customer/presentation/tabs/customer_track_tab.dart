import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Live tracking. Fully built in Phase 5 (stage stepper, driver click-to-call,
/// ETA/on-time, delivered + received-by; polls every 5s). Uses GET /tracking/order/{id}.
class CustomerTrackTab extends ConsumerWidget {
  const CustomerTrackTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.local_shipping_outlined, size: 64, color: Colors.black26),
          SizedBox(height: 12),
          Text('Track Delivery', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          SizedBox(height: 4),
          Text('Coming in Phase 5', style: TextStyle(color: Colors.black45)),
        ],
      ),
    );
  }
}
