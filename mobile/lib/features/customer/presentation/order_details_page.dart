import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/app_theme.dart';
import '../data/customer_repository.dart';
import '../data/models/order.dart';
import 'controllers/orders_controller.dart';
import 'widgets/order_status_badge.dart';

/// Full order details + AI insights + pricing + actions (cancel now; checkout
/// wired in Phase 4, tracking in Phase 5).
class OrderDetailsPage extends ConsumerStatefulWidget {
  const OrderDetailsPage({super.key, required this.orderId});
  final String orderId;

  @override
  ConsumerState<OrderDetailsPage> createState() => _OrderDetailsPageState();
}

class _OrderDetailsPageState extends ConsumerState<OrderDetailsPage> {
  bool _busy = false;

  Future<void> _cancel(Order order) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel order?'),
        content: const Text('This will cancel the delivery order. This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Cancel order')),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      await ref.read(customerRepositoryProvider).cancel(order.id);
      ref.invalidate(orderByIdProvider(order.id));
      await ref.read(ordersControllerProvider.notifier).refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order cancelled.')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Could not cancel the order. Please try again.')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderAsync = ref.watch(orderByIdProvider(widget.orderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),
      body: orderAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("Couldn't load this order."),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () => ref.invalidate(orderByIdProvider(widget.orderId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (order) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(orderByIdProvider(widget.orderId)),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _headerCard(order),
              const SizedBox(height: 12),
              _routeCard(order),
              const SizedBox(height: 12),
              _packageCard(order),
              if (order.recipientName != null || order.recipientContact != null) ...[
                const SizedBox(height: 12),
                _recipientCard(order),
              ],
              if (order.intelligence != null) ...[
                const SizedBox(height: 12),
                _insightsCard(order.intelligence!),
              ],
              const SizedBox(height: 12),
              _pricingCard(order),
              const SizedBox(height: 20),
              _actions(order),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  // --- section cards ---------------------------------------------------------

  Widget _card({required String title, required List<Widget> children}) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title.toUpperCase(),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 0.5)),
              const SizedBox(height: 12),
              ...children,
            ],
          ),
        ),
      );

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(width: 120, child: Text(label, style: const TextStyle(color: Colors.black54))),
            Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
          ],
        ),
      );

  Widget _headerCard(Order order) => Card(
        color: AppTheme.navy,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(order.packageDescription.isEmpty ? 'Delivery order' : order.packageDescription,
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                  OrderStatusBadge(order.status),
                ],
              ),
              const SizedBox(height: 8),
              Text('${order.pickupCity} → ${order.deliveryCity}', style: const TextStyle(color: Colors.white70)),
              const SizedBox(height: 4),
              Text('Created ${DateFormat('d MMM yyyy, h:mm a').format(order.createdAt)}',
                  style: const TextStyle(color: Colors.white60, fontSize: 12)),
            ],
          ),
        ),
      );

  Widget _routeCard(Order order) => _card(title: 'Route', children: [
        _row('Pickup', '${order.pickupAddress}, ${order.pickupCity}'),
        _row('Delivery', '${order.deliveryAddress}, ${order.deliveryCity}'),
        _row('Pickup window',
            '${DateFormat('d MMM yyyy').format(order.preferredPickupDate)} at ${order.pickupTimeLabel}'),
        _row('Priority', order.priority),
      ]);

  Widget _packageCard(Order order) => _card(title: 'Package', children: [
        _row('Description', order.packageDescription),
        _row('Weight', '${order.weightKg} kg'),
        _row('Dimensions', '${order.lengthCm} × ${order.widthCm} × ${order.heightCm} cm'),
        if ((order.specialHandling ?? '').isNotEmpty) _row('Special handling', order.specialHandling!),
      ]);

  Widget _recipientCard(Order order) => _card(title: 'Recipient', children: [
        if (order.recipientName != null) _row('Name', order.recipientName!),
        if (order.recipientContact != null) _row('Contact', order.recipientContact!),
      ]);

  Widget _insightsCard(OrderIntelligence intel) => _card(title: 'AI Package Insights', children: [
        _row('Volume', '${intel.volumeM3.toStringAsFixed(3)} m³'),
        _row('Weight class', intel.weightClassification),
        _row('Handling', intel.handlingRequirement),
        _row('Suggested priority', intel.recommendedPriority),
        if (intel.risksOrAmbiguities.isNotEmpty) ...[
          const SizedBox(height: 4),
          const Text('Notes', style: TextStyle(color: Colors.black54)),
          const SizedBox(height: 4),
          ...intel.risksOrAmbiguities.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('• '),
                  Expanded(child: Text(r)),
                ]),
              )),
        ],
      ]);

  Widget _pricingCard(Order order) {
    final p = order.pricing;
    if (p == null) {
      return _card(title: 'Delivery Fee', children: const [
        Text('Fee is being calculated and will be settled before dispatch / on delivery.',
            style: TextStyle(color: Colors.black54)),
      ]);
    }
    Widget line(String l, double v, {bool bold = false}) => Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text(l, style: TextStyle(color: bold ? Colors.black : Colors.black54, fontWeight: bold ? FontWeight.bold : null)),
            Text('Rs. ${v.toStringAsFixed(2)}',
                style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.w500, fontSize: bold ? 16 : 14)),
          ]),
        );
    return _card(title: 'Delivery Fee', children: [
      line('Base fee', p.baseFee),
      line('Distance', p.distanceCharge),
      line('Weight', p.weightCharge),
      line('Volume', p.volumeCharge),
      line('Priority', p.priorityCharge),
      line('Handling', p.handlingCharge),
      const Divider(),
      line('Total', p.totalDeliveryFee, bold: true),
    ]);
  }

  Widget _actions(Order order) {
    if (order.isCancelled) {
      return const Center(child: Text('This order was cancelled.', style: TextStyle(color: Colors.black54)));
    }
    if (order.isConfirmed) {
      return Column(children: [
        FilledButton.icon(
          onPressed: () => context.push('/customer/order/${order.id}/track'),
          icon: const Icon(Icons.local_shipping),
          label: const Text('Track delivery'),
        ),
      ]);
    }
    // Pending
    return Column(children: [
      FilledButton.icon(
        onPressed: _busy ? null : () => context.push('/customer/order/${order.id}/checkout'),
        icon: const Icon(Icons.payment),
        label: const Text('Checkout & Pay'),
      ),
      const SizedBox(height: 8),
      OutlinedButton.icon(
        onPressed: _busy ? null : () => _cancel(order),
        icon: const Icon(Icons.close),
        label: Text(_busy ? 'Cancelling…' : 'Cancel order'),
        style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
      ),
    ]);
  }
}
