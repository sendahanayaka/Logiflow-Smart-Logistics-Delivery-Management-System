import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../controllers/orders_controller.dart';

/// Track tab: lists the customer's confirmed orders (the ones with a delivery
/// in progress) → tap to open live tracking. Uses the same orders list.
class CustomerTrackTab extends ConsumerWidget {
  const CustomerTrackTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersControllerProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(ordersControllerProvider.notifier).refresh(),
      child: ordersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ListView(children: [
          const SizedBox(height: 120),
          const Center(child: Text("Couldn't load your deliveries.")),
          const SizedBox(height: 12),
          Center(
            child: OutlinedButton(
              onPressed: () => ref.read(ordersControllerProvider.notifier).refresh(),
              child: const Text('Retry'),
            ),
          ),
        ]),
        data: (orders) {
          final trackable = orders.where((o) => o.isConfirmed).toList();
          if (trackable.isEmpty) {
            return ListView(children: const [
              SizedBox(height: 120),
              Icon(Icons.local_shipping_outlined, size: 64, color: Colors.black26),
              SizedBox(height: 12),
              Center(child: Text('Nothing to track yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
              SizedBox(height: 4),
              Center(child: Text('Confirmed orders appear here.', style: TextStyle(color: Colors.black45))),
            ]);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: trackable.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) {
              final o = trackable[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.local_shipping)),
                  title: Text(o.packageDescription.isEmpty ? 'Delivery order' : o.packageDescription,
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text('${o.pickupCity} → ${o.deliveryCity}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/customer/order/${o.id}/track'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
