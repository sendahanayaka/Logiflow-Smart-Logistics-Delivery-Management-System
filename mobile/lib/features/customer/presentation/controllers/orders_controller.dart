import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/customer_repository.dart';
import '../../data/models/order.dart';

/// Loads and refreshes the signed-in customer's orders (GET /orders/my-orders).
class OrdersController extends AsyncNotifier<List<Order>> {
  @override
  Future<List<Order>> build() => ref.read(customerRepositoryProvider).myOrders();

  /// Re-fetch (used by pull-to-refresh and after create/cancel/checkout).
  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref.read(customerRepositoryProvider).myOrders());
  }
}

final ordersControllerProvider =
    AsyncNotifierProvider<OrdersController, List<Order>>(OrdersController.new);

/// A single order by id (details page). Autodisposed per id.
final orderByIdProvider = FutureProvider.autoDispose.family<Order, String>(
  (ref, id) => ref.read(customerRepositoryProvider).orderById(id),
);
