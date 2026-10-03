import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

/// Warehouse + dispatch data access. TODO: map responses to typed models.
class WarehouseRepository {
  WarehouseRepository(this._dio);
  final Dio _dio;

  // Warehouses & zones
  Future<List<dynamic>> warehouses() async => (await _dio.get('/warehouse')).data as List;
  Future<Map<String, dynamic>> createWarehouse(Map<String, dynamic> body) async =>
      (await _dio.post('/warehouse', data: body)).data as Map<String, dynamic>;
  Future<List<dynamic>> zones(String warehouseId) async =>
      (await _dio.get('/warehouse/$warehouseId/zones')).data as List;
  Future<Map<String, dynamic>> createZone(String warehouseId, Map<String, dynamic> body) async =>
      (await _dio.post('/warehouse/$warehouseId/zones', data: body)).data as Map<String, dynamic>;

  // Packages
  Future<Map<String, dynamic>> intake(Map<String, dynamic> body) async =>
      (await _dio.post('/warehouse/intake', data: body)).data as Map<String, dynamic>;
  Future<dynamic> packages(String warehouseId, {String? status}) async =>
      (await _dio.get('/warehouse/$warehouseId/packages',
              queryParameters: status == null ? null : {'status': status}))
          .data;
  Future<Map<String, dynamic>> makeAvailable(String packageId) async =>
      (await _dio.patch('/warehouse/packages/$packageId/availability')).data as Map<String, dynamic>;

  // Orders available for intake (shared list endpoint)
  Future<List<dynamic>> intakeOrders() async => (await _dio.get('/orders')).data as List;

  // Dispatch batches + hand-off to the agent
  Future<Map<String, dynamic>> createBatch(Map<String, dynamic> body) async =>
      (await _dio.post('/dispatch/batches', data: body)).data as Map<String, dynamic>;
  Future<Map<String, dynamic>> planRouteFromBatch(String batchId) async =>
      (await _dio.post('/workflows/from-batch/$batchId')).data as Map<String, dynamic>;
}

final warehouseRepositoryProvider =
    Provider<WarehouseRepository>((ref) => WarehouseRepository(ref.read(dioProvider)));
