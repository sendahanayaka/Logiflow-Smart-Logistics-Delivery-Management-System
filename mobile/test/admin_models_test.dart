import 'package:flutter_test/flutter_test.dart';
import 'package:logiflow_mobile/features/admin/data/models/workflow.dart';
import 'package:logiflow_mobile/features/admin/data/models/admin_shipment.dart';
import 'package:logiflow_mobile/features/admin/data/models/fleet.dart';
import 'package:logiflow_mobile/features/admin/data/models/app_user.dart';
import 'package:logiflow_mobile/features/admin/data/models/tracking_view.dart';

void main() {
  group('WorkflowSummary / WorkflowDetail', () {
    test('summary flags AwaitingApproval', () {
      final w = WorkflowSummary.fromJson({
        'id': 'w1',
        'workflowKey': 'WF-001',
        'status': 'AwaitingApproval',
        'objective': 'Evening run',
        'summary': 'Looks good',
        'stopCount': 3,
        'createdAt': '2026-10-05T08:00:00',
        'updatedAt': '2026-10-05T08:05:00',
      });
      expect(w.isAwaitingApproval, isTrue);
      expect(w.stopCount, 3);
    });

    test('detail parses ordered stops + allocation', () {
      final d = WorkflowDetail.fromJson({
        'id': 'w1',
        'workflowKey': 'WF-001',
        'dispatchBatchId': 'b1',
        'status': 'AwaitingApproval',
        'objective': 'Evening run',
        'summary': 'Efficient',
        'totalDistanceKm': 42.5,
        'stopCount': 2,
        'createdAt': '2026-10-05T08:00:00',
        'allocatedDriverId': 'drv-1',
        'allocatedVehicleId': 'veh-1',
        'allocationSummary': 'Kamal + WP-CAB-1234',
        'stops': [
          {
            'id': 's1', 'sequence': 1, 'stopKey': 'k1', 'orderId': 'o1', 'address': '12 Galle Rd',
            'latitude': 6.9, 'longitude': 79.8, 'distanceFromPrevKm': 0.0, 'eta': '2026-10-05T09:00:00',
            'windowStart': null, 'windowEnd': null, 'onTime': true, 'status': 'Pending',
          },
          {
            'id': 's2', 'sequence': 2, 'stopKey': 'k2', 'orderId': 'o2', 'address': '45 Kandy Rd',
            'latitude': 7.3, 'longitude': 80.6, 'distanceFromPrevKm': 42.5, 'eta': '2026-10-05T10:30:00',
            'windowStart': null, 'windowEnd': null, 'onTime': false, 'status': 'Pending',
          },
        ],
      });
      expect(d.isAwaitingApproval, isTrue);
      expect(d.stops.length, 2);
      expect(d.stops[1].distanceFromPrevKm, 42.5);
      expect(d.allocationSummary, 'Kamal + WP-CAB-1234');
      expect(d.totalDistanceKm, 42.5);
    });

    test('ApprovalResult parses shipment code', () {
      final r = ApprovalResult.fromJson({
        'workflowId': 'w1', 'status': 'Approved', 'shipmentId': 'shp-1',
        'shipmentCode': 'SHP-001', 'message': 'Dispatched',
      });
      expect(r.shipmentCode, 'SHP-001');
      expect(r.status, 'Approved');
    });
  });

  group('AdminShipment', () {
    test('isActive is false for Delivered/Cancelled', () {
      AdminShipment s(String status) => AdminShipment.fromJson({
            'id': 's', 'shipmentCode': 'C', 'status': status, 'driverId': 'd', 'vehicleId': 'v',
            'totalDistanceKm': 10, 'stopCount': 2, 'deliveredCount': 1, 'dispatchedAt': null,
            'createdAt': '2026-10-05T08:00:00',
          });
      expect(s('InTransit').isActive, isTrue);
      expect(s('Delivered').isActive, isFalse);
      expect(s('Cancelled').isActive, isFalse);
    });
  });

  group('Fleet status labels (int enums)', () {
    test('driver status int maps to label', () {
      Driver d(int status) => Driver.fromJson({
            'id': 'd', 'fullName': 'Kamal', 'licenseNumber': 'B123', 'licenseExpiryDate': '2027-01-01T00:00:00',
            'phoneNumber': '077', 'status': status, 'createdAt': '2026-10-05T08:00:00',
          });
      expect(d(1).statusLabel, 'Available');
      expect(d(3).statusLabel, 'On delivery');
      expect(d(5).statusLabel, 'Inactive');
    });

    test('vehicle status int maps to label', () {
      Vehicle v(int status) => Vehicle.fromJson({
            'id': 'v', 'registrationNumber': 'WP-1', 'vehicleType': 'Van', 'make': 'Toyota',
            'model': 'HiAce', 'capacity': 1000, 'status': status, 'createdAt': '2026-10-05T08:00:00',
          });
      expect(v(0).statusLabel, 'Available');
      expect(v(1).statusLabel, 'In transit');
      expect(v(2).statusLabel, 'In maintenance');
    });
  });

  group('AppUser / Role', () {
    test('parses user with active flag', () {
      final u = AppUser.fromJson({
        'id': 'u1', 'name': 'Admin', 'email': 'admin@logiflow.com', 'role': 'ADMIN',
        'roleId': '1111', 'isActive': true, 'createdAt': '2026-10-05T08:00:00',
      });
      expect(u.role, 'ADMIN');
      expect(u.isActive, isTrue);
      final r = Role.fromJson({'id': 'r1', 'name': 'CUSTOMER'});
      expect(r.name, 'CUSTOMER');
    });
  });

  group('TrackingView (admin)', () {
    test('parses all stops with delivered status', () {
      final t = TrackingView.fromJson({
        'shipmentId': 's1', 'shipmentCode': 'SHP-001', 'status': 'InTransit',
        'stops': [
          {
            'sequence': 1, 'stopKey': 'k1', 'address': '12 Galle Rd', 'plannedEta': '2026-10-05T09:00:00',
            'status': 'Delivered', 'actualAt': '2026-10-05T09:05:00', 'note': null, 'onTime': true,
            'distanceFromPrevKm': 0.0, 'recipientName': 'Nimal', 'recipientContact': '077',
          },
          {
            'sequence': 2, 'stopKey': 'k2', 'address': '45 Kandy Rd', 'plannedEta': '2026-10-05T10:30:00',
            'status': 'Pending', 'actualAt': null, 'note': null, 'onTime': null,
            'distanceFromPrevKm': 42.5, 'recipientName': 'Sunil', 'recipientContact': null,
          },
        ],
      });
      expect(t.stops.length, 2);
      expect(t.stops[0].status, 'Delivered');
      expect(t.stops[0].actualAt, isNotNull);
      expect(t.stops[1].distanceFromPrevKm, 42.5);
    });
  });
}
