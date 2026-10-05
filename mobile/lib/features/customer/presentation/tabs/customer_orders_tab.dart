import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_state.dart';
import '../../data/models/order.dart';
import '../controllers/orders_controller.dart';
import '../widgets/order_status_badge.dart';

/// My Orders list — GET /orders/my-orders, pull-to-refresh, tap → details.
class CustomerOrdersTab extends ConsumerWidget {
  const CustomerOrdersTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersControllerProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(ordersControllerProvider.notifier).refresh(),
      child: ordersAsync.when(
        loading: () => const LoadingState(label: 'Loading your orders…'),
        error: (e, _) => EmptyState(
          icon: Icons.cloud_off_outlined,
          title: 'Orders unavailable',
          message: 'Check your connection and try again.',
          actionLabel: 'Retry',
          onAction: () => ref.read(ordersControllerProvider.notifier).refresh(),
        ),
        data: (orders) {
          if (orders.isEmpty) {
            return const EmptyState(
              icon: Icons.inventory_2_outlined,
              title: 'No orders yet',
              message: 'Create an order from the New tab to get started.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _OrderCard(order: orders[i]),
          );
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});
  final Order order;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/customer/order/${order.id}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      order.packageDescription.isEmpty
                          ? 'Delivery order'
                          : order.packageDescription,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OrderStatusBadge(order.status),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.route, size: 16, color: Colors.black45),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      '${order.pickupCity} → ${order.deliveryCity}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.black87),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.event, size: 16, color: Colors.black45),
                  const SizedBox(width: 6),
                  Text(
                      '${DateFormat('d MMM yyyy').format(order.preferredPickupDate)} · ${order.pickupTimeLabel}',
                      style:
                          const TextStyle(color: Colors.black54, fontSize: 13)),
                  const Spacer(),
                  if (order.pricing != null)
                    Text(
                        'Rs. ${order.pricing!.totalDeliveryFee.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
