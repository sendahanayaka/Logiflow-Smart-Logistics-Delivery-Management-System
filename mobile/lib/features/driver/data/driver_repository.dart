import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import 'models/driver_models.dart';

/// Driver data access repository (shipments, events, POD).
class DriverRepository {
  DriverRepository(this._dio);
  final Dio _dio;

  /// Fetch assigned delivery runs for the current driver.
  Future<List<ShipmentSummary>> myRuns() async {
    final response = await _dio.get('/shipments/mine');
    final list = response.data as List<dynamic>? ?? [];
    return list
        .map((item) => ShipmentSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  /// Fetch detail and stops timeline for a single run.
  Future<DriverRunView> run(String shipmentId) async {
    final response = await _dio.get('/shipments/$shipmentId/run');
    return DriverRunView.fromJson(response.data as Map<String, dynamic>);
  }

  /// Report progress event at a stop: kind = 'ARRIVED' | 'DEPARTED'
  Future<void> recordEvent(
    String shipmentId, {
    required String stopKey,
    required String kind,
    String? note,
    double? latitude,
    double? longitude,
  }) async {
    final body = <String, dynamic>{
      'stopKey': stopKey,
      'kind': kind,
      if (note != null && note.isNotEmpty) 'note': note,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    };
    await _dio.post('/shipments/$shipmentId/events', data: body);
  }

  /// Submit Proof of Delivery (POD) for a stop.
  Future<void> proofOfDelivery(
    String shipmentId, {
    required String stopKey,
    required String receivedByName,
    String? notes,
    String? photoUrl,
    String? signatureImageUrl,
  }) async {
    final body = <String, dynamic>{
      'stopKey': stopKey,
      'receivedByName': receivedByName,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
      if (photoUrl != null && photoUrl.isNotEmpty) 'photoUrl': photoUrl,
      if (signatureImageUrl != null && signatureImageUrl.isNotEmpty)
        'signatureImageUrl': signatureImageUrl,
    };
    await _dio.post('/shipments/$shipmentId/pod', data: body);
  }
}

final driverRepositoryProvider = Provider<DriverRepository>(
  (ref) => DriverRepository(ref.read(dioProvider)),
);

/// Provider for list of assigned driver runs.
final driverRunsProvider = FutureProvider.autoDispose<List<ShipmentSummary>>((ref) async {
  final repo = ref.watch(driverRepositoryProvider);
  return repo.myRuns();
});

/// Family Provider for a single driver run detail.
final driverRunDetailProvider = FutureProvider.autoDispose.family<DriverRunView, String>((ref, shipmentId) async {
  final repo = ref.watch(driverRepositoryProvider);
  return repo.run(shipmentId);
});
