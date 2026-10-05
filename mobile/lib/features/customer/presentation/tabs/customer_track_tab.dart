import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_state.dart';
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
        loading: () => const LoadingState(label: 'Loading deliveries…'),
        error: (e, _) => EmptyState(
          icon: Icons.cloud_off_outlined,
          title: 'Deliveries unavailable',
          message: 'Check your connection and try again.',
          actionLabel: 'Retry',
          onAction: () => ref.read(ordersControllerProvider.notifier).refresh(),
        ),
        data: (orders) {
          final trackable = orders.where((o) => o.isConfirmed).toList();
          if (trackable.isEmpty) {
            return const EmptyState(
              icon: Icons.local_shipping_outlined,
              title: 'Nothing to track yet',
              message: 'Confirmed orders will appear here.',
            );
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
                  leading:
                      const CircleAvatar(child: Icon(Icons.local_shipping)),
                  title: Text(
                      o.packageDescription.isEmpty
                          ? 'Delivery order'
                          : o.packageDescription,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
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
