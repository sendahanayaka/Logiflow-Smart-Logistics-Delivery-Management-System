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

  /// Inventory for a warehouse. The backend returns a paged result; the first
  /// page (up to [pageSize]) is enough for the mobile stock view.
  Future<List<WarehousePackage>> getPackages(
    String warehouseId, {
    String? status,
    String? storageZoneId,
    String? trackingCode,
    int page = 1,
    int pageSize = 50,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      '/warehouse/$warehouseId/packages',
      queryParameters: {
        'page': page,
        'pageSize': pageSize,
        if (status != null && status.isNotEmpty) 'status': status,
        if (storageZoneId != null && storageZoneId.isNotEmpty)
          'storageZoneId': storageZoneId,
        if (trackingCode != null && trackingCode.isNotEmpty)
          'trackingCode': trackingCode,
      },
    );
    final items = _map(response.data)['items'];
    return _list(items).map((item) => WarehousePackage.fromJson(_map(item))).toList();
  }

  Future<Warehouse> updateWarehouse(
      String warehouseId, UpdateWarehouseRequest request) async {
    final response = await _dio.put<Map<String, dynamic>>(
        '/warehouse/$warehouseId',
        data: request.toJson());
    return Warehouse.fromJson(_map(response.data));
  }

  Future<StorageZone> updateStorageZone(
      String warehouseId, String zoneId, UpdateStorageZoneRequest request) async {
    final response = await _dio.put<Map<String, dynamic>>(
        '/warehouse/$warehouseId/zones/$zoneId',
        data: request.toJson());
    return StorageZone.fromJson(_map(response.data));
  }

  Future<WarehousePackage> updatePackage(
      String packageId, UpdatePackageRequest request) async {
    final response = await _dio.put<Map<String, dynamic>>(
        '/warehouse/packages/$packageId',
        data: request.toJson());
    return WarehousePackage.fromJson(_map(response.data));
  }

  Future<WarehousePackage> makePackageAvailable(String packageId) async {
    final response = await _dio.patch<Map<String, dynamic>>(
        '/warehouse/packages/$packageId/availability');
    return WarehousePackage.fromJson(_map(response.data));
  }
}

List<dynamic> _list(Object? value) => value is List ? value : const [];

Map<String, dynamic> _map(Object? value) =>
    Map<String, dynamic>.from(value as Map);

final warehouseRepositoryProvider = Provider<WarehouseRepository>(
    (ref) => WarehouseRepository(ref.read(dioProvider)));
