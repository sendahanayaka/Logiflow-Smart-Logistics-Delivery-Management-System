// ignore_for_file: prefer_const_literals_to_create_immutables
import 'package:flutter_test/flutter_test.dart';
import 'package:logiflow_mobile/features/driver/data/models/driver_models.dart';

void main() {
  test('ShipmentSummary parses a driver run row', () {
    final s = ShipmentSummary.fromJson({
      'id': 'shp-1', 'shipmentCode': 'SHP-001', 'status': 'Dispatched',
      'driverId': 'drv-1', 'vehicleId': 'veh-1', 'totalDistanceKm': 42.5,
      'stopCount': 3, 'deliveredCount': 1, 'dispatchedAt': '2026-10-05T08:00:00',
      'createdAt': '2026-10-05T07:00:00',
    });
    expect(s.shipmentCode, 'SHP-001');
    expect(s.stopCount, 3);
    expect(s.deliveredCount, 1);
    expect(s.totalDistanceKm, 42.5);
  });

  test('DriverRunView parses run detail with ordered stops', () {
    final r = DriverRunView.fromJson({
      'shipmentId': 'shp-1', 'shipmentCode': 'SHP-001', 'status': 'InTransit',
      'driverId': 'drv-1', 'vehicleId': 'veh-1',
      'stops': [
        {
          'sequence': 1, 'stopKey': 'k1', 'address': '12 Galle Rd', 'plannedEta': '2026-10-05T09:00:00',
          'status': 'Delivered', 'actualAt': '2026-10-05T09:05:00', 'note': 'Left at door', 'onTime': true,
          'latitude': 6.9, 'longitude': 79.8, 'distanceFromPrevKm': 0.0,
          'recipientName': 'Nimal', 'recipientContact': '0771234567',
        },
        {
          'sequence': 2, 'stopKey': 'k2', 'address': '45 Kandy Rd', 'plannedEta': '2026-10-05T10:30:00',
          'status': 'Pending', 'actualAt': null, 'note': null, 'onTime': null,
          'latitude': 7.3, 'longitude': 80.6, 'distanceFromPrevKm': 42.5,
          'recipientName': 'Sunil', 'recipientContact': null,
        },
      ],
    });
    expect(r.shipmentCode, 'SHP-001');
    expect(r.stops.length, 2);
    expect(r.stops[0].status, 'Delivered');
    expect(r.stops[0].recipientContact, '0771234567');
    expect(r.stops[1].distanceFromPrevKm, 42.5);
    expect(r.stops[1].onTime, isNull);
  });
}
