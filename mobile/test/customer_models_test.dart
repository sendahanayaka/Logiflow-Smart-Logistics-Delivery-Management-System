import 'package:flutter_test/flutter_test.dart';
import 'package:logiflow_mobile/features/customer/data/models/order.dart';
import 'package:logiflow_mobile/features/customer/data/models/create_order_request.dart';
import 'package:logiflow_mobile/features/customer/data/models/customer_tracking.dart';

void main() {
  group('Order.fromJson', () {
    test('parses a full order with intelligence + pricing', () {
      final json = {
        'id': '11111111-1111-1111-1111-111111111111',
        'customerId': '22222222-2222-2222-2222-222222222222',
        'pickupAddress': '12 Galle Rd',
        'pickupCity': 'Colombo',
        'deliveryAddress': '45 Kandy Rd',
        'deliveryCity': 'Kandy',
        'packageDescription': 'Laptop',
        'specialHandling': 'Fragile',
        'preferredPickupDate': '2026-10-10T00:00:00',
        'preferredPickupTime': '14:30:00',
        'priority': 'Express',
        'weightKg': 2.5,
        'lengthCm': 40,
        'widthCm': 30,
        'heightCm': 10,
        'recipientName': 'Nimal',
        'recipientContact': '0771234567',
        'status': 'Pending',
        'createdAt': '2026-10-05T09:00:00',
        'updatedAt': null,
        'intelligence': {
          'volumeM3': 0.012,
          'weightClassification': 'Light',
          'handlingRequirement': 'Fragile',
          'recommendedPriority': 'Express',
          'risksOrAmbiguities': ['Fragile item', 'Verify recipient'],
        },
        'pricing': {
          'baseFee': 500,
          'distanceCharge': 1200.5,
          'weightCharge': 100,
          'volumeCharge': 50,
          'priorityCharge': 200,
          'handlingCharge': 75,
          'totalDeliveryFee': 2125.5,
        },
      };

      final o = Order.fromJson(json);
      expect(o.id, '11111111-1111-1111-1111-111111111111');
      expect(o.pickupCity, 'Colombo');
      expect(o.deliveryCity, 'Kandy');
      expect(o.priority, 'Express');
      expect(o.weightKg, 2.5);
      expect(o.isPending, isTrue);
      expect(o.isConfirmed, isFalse);
      expect(o.pickupTimeLabel, '14:30'); // HH:mm from HH:mm:ss
      expect(o.intelligence, isNotNull);
      expect(o.intelligence!.risksOrAmbiguities.length, 2);
      expect(o.pricing!.totalDeliveryFee, 2125.5);
    });

    test('handles null pricing/intelligence and confirmed status', () {
      final o = Order.fromJson({
        'id': 'x',
        'customerId': 'y',
        'pickupAddress': 'a',
        'pickupCity': 'Colombo',
        'deliveryAddress': 'b',
        'deliveryCity': 'Galle',
        'packageDescription': 'Box',
        'preferredPickupDate': '2026-10-10T00:00:00',
        'preferredPickupTime': '09:00:00',
        'priority': 'Standard',
        'weightKg': 1,
        'lengthCm': 1,
        'widthCm': 1,
        'heightCm': 1,
        'status': 'Confirmed',
        'createdAt': '2026-10-05T09:00:00',
      });
      expect(o.pricing, isNull);
      expect(o.intelligence, isNull);
      expect(o.isConfirmed, isTrue);
      expect(o.recipientName, isNull);
    });
  });

  group('CreateOrderRequest.toJson', () {
    test('serializes TimeSpan as HH:mm:ss and date-only ISO', () {
      final req = CreateOrderRequest(
        pickupAddress: '12 Galle Rd',
        pickupCity: 'Colombo',
        deliveryAddress: '45 Kandy Rd',
        deliveryCity: 'Kandy',
        packageDescription: 'Laptop',
        specialHandling: null,
        preferredPickupDate: DateTime(2026, 10, 10, 15, 45), // time part should be dropped
        preferredPickupTime: const Duration(hours: 14, minutes: 30),
        priority: 'Express',
        weightKg: 2.5,
        lengthCm: 40,
        widthCm: 30,
        heightCm: 10,
        recipientName: 'Nimal',
        recipientContact: '0771234567',
      );
      final j = req.toJson();
      expect(j['preferredPickupTime'], '14:30:00');
      expect(j['preferredPickupDate'], startsWith('2026-10-10T00:00:00'));
      expect(j['priority'], 'Express');
      expect(j['weightKg'], 2.5);
    });
  });

  group('CustomerTracking.fromJson', () {
    test('parses dispatched tracking with driver + ETA', () {
      final t = CustomerTracking.fromJson({
        'orderId': 'o1',
        'hasShipment': true,
        'stage': 'Dispatched',
        'shipmentCode': 'SHP-001',
        'shipmentStatus': 'InTransit',
        'driverName': 'Kamal',
        'driverContact': '0712223334',
        'vehicleRegistration': 'WP-CAB-1234',
        'stopSequence': 2,
        'eta': '2026-10-05T10:30:00',
        'stopStatus': 'EnRoute',
        'onTime': true,
        'arrivedAt': null,
        'deliveredAt': null,
        'receivedByName': null,
      });
      expect(t.hasShipment, isTrue);
      expect(t.driverName, 'Kamal');
      expect(t.vehicleRegistration, 'WP-CAB-1234');
      expect(t.onTime, isTrue);
      expect(t.isDelivered, isFalse);
    });

    test('detects delivered via deliveredAt', () {
      final t = CustomerTracking.fromJson({
        'orderId': 'o1',
        'hasShipment': true,
        'stage': 'Dispatched',
        'deliveredAt': '2026-10-05T11:00:00',
        'receivedByName': 'Sunil',
      });
      expect(t.isDelivered, isTrue);
      expect(t.receivedByName, 'Sunil');
    });

    test('preparing stage before a shipment exists', () {
      final t = CustomerTracking.fromJson({'orderId': 'o1', 'hasShipment': false, 'stage': 'Preparing'});
      expect(t.hasShipment, isFalse);
      expect(t.stage, 'Preparing');
      expect(t.driverName, isNull);
    });
  });
}
