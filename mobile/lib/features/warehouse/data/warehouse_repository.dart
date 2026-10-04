import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import 'models/warehouse_models.dart';

/// Warehouse package-intake data access. Auth is provided by the shared Dio
/// interceptor; this repository never creates a separate HTTP client.
class WarehouseRepository {
  WarehouseRepository(this._dio);
  final Dio _dio;

  Future<List<Warehouse>> getWarehouses() async {
    final response = await _dio.get<List<dynamic>>('/warehouse');
    return _list(response.data)
        .map((item) => Warehouse.fromJson(_map(item)))
        .toList();
  }

  Future<List<StorageZone>> getStorageZones(String warehouseId) async {
    final response =
        await _dio.get<List<dynamic>>('/warehouse/$warehouseId/zones');
    return _list(response.data)
        .map((item) => StorageZone.fromJson(_map(item)))
        .toList();
  }

  Future<List<IntakeOrder>> getIntakeOrders() async {
    final response = await _dio.get<List<dynamic>>('/orders');
    return _list(response.data)
        .map((item) => IntakeOrder.fromJson(_map(item)))
        .toList();
  }

  Future<WarehousePackage> receivePackage(ReceivePackageRequest request) async {
    final response = await _dio.post<Map<String, dynamic>>('/warehouse/intake',
        data: request.toJson());
    return WarehousePackage.fromJson(_map(response.data));
  }
}

List<dynamic> _list(Object? value) => value is List ? value : const [];

Map<String, dynamic> _map(Object? value) =>
    Map<String, dynamic>.from(value as Map);

final warehouseRepositoryProvider = Provider<WarehouseRepository>(
    (ref) => WarehouseRepository(ref.read(dioProvider)));
