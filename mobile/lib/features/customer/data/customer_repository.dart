import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import 'models/create_order_request.dart';
import 'models/customer_tracking.dart';
import 'models/order.dart';

/// Customer data access (orders + tracking), returning typed models.
class CustomerRepository {
  CustomerRepository(this._dio);
  final Dio _dio;

  Future<List<Order>> myOrders() async {
    final res = await _dio.get('/orders/my-orders');
    return (res.data as List).map((e) => Order.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Order> createOrder(CreateOrderRequest request) async {
    final res = await _dio.post('/orders', data: request.toJson());
    return Order.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Order> orderById(String id) async {
    final res = await _dio.get('/orders/$id');
    return Order.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Order> checkout(String id, String paymentMethod) async {
    final res = await _dio.patch('/orders/$id/checkout', data: {'paymentMethod': paymentMethod});
    return Order.fromJson(res.data as Map<String, dynamic>);
  }

  Future<Order> cancel(String id) async {
    final res = await _dio.patch('/orders/$id/cancel');
    return Order.fromJson(res.data as Map<String, dynamic>);
  }

  /// Live tracking for one of the customer's own orders.
  Future<CustomerTracking> orderTracking(String orderId) async {
    final res = await _dio.get('/tracking/order/$orderId');
    return CustomerTracking.fromJson(res.data as Map<String, dynamic>);
  }
}

final customerRepositoryProvider =
    Provider<CustomerRepository>((ref) => CustomerRepository(ref.read(dioProvider)));
