import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

/// Driver data access (shipments). TODO: map responses to typed models.
class DriverRepository {
  DriverRepository(this._dio);
  final Dio _dio;

  Future<List<dynamic>> myRuns() async => (await _dio.get('/shipments/mine')).data as List;
  Future<Map<String, dynamic>> run(String shipmentId) async =>
      (await _dio.get('/shipments/$shipmentId/run')).data as Map<String, dynamic>;

  /// kind = 'ARRIVED' | 'DEPARTED'
  Future<Map<String, dynamic>> recordEvent(String shipmentId, String stopKey, String kind) async =>
      (await _dio.post('/shipments/$shipmentId/events', data: {'stopKey': stopKey, 'kind': kind})).data as Map<String, dynamic>;

  Future<Map<String, dynamic>> proofOfDelivery(String shipmentId, Map<String, dynamic> body) async =>
      (await _dio.post('/shipments/$shipmentId/pod', data: body)).data as Map<String, dynamic>;
}

final driverRepositoryProvider =
    Provider<DriverRepository>((ref) => DriverRepository(ref.read(dioProvider)));
