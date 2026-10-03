import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

/// Customer data access (orders + tracking). TODO: map responses to typed models.
class CustomerRepository {
  CustomerRepository(this._dio);
  final Dio _dio;

  Future<List<dynamic>> myOrders() async => (await _dio.get('/orders/my-orders')).data as List;
  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> body) async =>
      (await _dio.post('/orders', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> orderById(String id) async =>
      (await _dio.get('/orders/$id')).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> checkout(String id, String paymentMethod) async =>
      (await _dio.patch('/orders/$id/checkout', data: {'paymentMethod': paymentMethod})).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> cancel(String id) async =>
      (await _dio.patch('/orders/$id/cancel')).data as Map<String, dynamic>;

  // Live tracking
  Future<Map<String, dynamic>> orderTracking(String orderId) async =>
      (await _dio.get('/tracking/order/$orderId')).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> trackByCode(String code) async =>
      (await _dio.get('/tracking/code/$code')).data as Map<String, dynamic>;
}

final customerRepositoryProvider =
    Provider<CustomerRepository>((ref) => CustomerRepository(ref.read(dioProvider)));
