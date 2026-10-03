import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

/// Admin/ops data access (workflows, approvals, shipments, fleet, users).
/// TODO: map responses to typed models; split into sub-repos if it grows.
class AdminRepository {
  AdminRepository(this._dio);
  final Dio _dio;

  // Agent workflows + approval
  Future<List<dynamic>> workflows({String? status}) async =>
      (await _dio.get('/workflows', queryParameters: status == null ? null : {'status': status})).data as List;
  Future<Map<String, dynamic>> workflow(String id) async =>
      (await _dio.get('/workflows/$id')).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> approve(String id, Map<String, dynamic> body) async =>
      (await _dio.post('/workflows/$id/approval', data: body)).data as Map<String, dynamic>;

  // Shipments
  Future<List<dynamic>> shipments() async => (await _dio.get('/shipments')).data as List;

  // Fleet
  Future<List<dynamic>> drivers() async => (await _dio.get('/drivers')).data as List;
  Future<List<dynamic>> vehicles() async => (await _dio.get('/vehicles')).data as List;

  // Users
  Future<List<dynamic>> users() async => (await _dio.get('/users')).data as List;
}

final adminRepositoryProvider =
    Provider<AdminRepository>((ref) => AdminRepository(ref.read(dioProvider)));
