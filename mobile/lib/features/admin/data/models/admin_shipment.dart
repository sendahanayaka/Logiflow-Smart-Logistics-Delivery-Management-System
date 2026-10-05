// Admin shipment row — mirrors the backend ShipmentSummary.

double _d(dynamic v) => v == null ? 0 : (v as num).toDouble();
DateTime _dt(dynamic v) => DateTime.tryParse((v ?? '').toString()) ?? DateTime.now();
DateTime? _dtn(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());

class AdminShipment {
  const AdminShipment({
    required this.id,
    required this.shipmentCode,
    required this.status,
    required this.driverId,
    required this.vehicleId,
    required this.totalDistanceKm,
    required this.stopCount,
    required this.deliveredCount,
    this.dispatchedAt,
    required this.createdAt,
  });

  final String id;
  final String shipmentCode;
  final String status; // Dispatched|InTransit|Delivered|Cancelled ...
  final String driverId;
  final String vehicleId;
  final double totalDistanceKm;
  final int stopCount;
  final int deliveredCount;
  final DateTime? dispatchedAt;
  final DateTime createdAt;

  bool get isActive => status != 'Delivered' && status != 'Cancelled';

  factory AdminShipment.fromJson(Map<String, dynamic> j) => AdminShipment(
        id: (j['id'] ?? '').toString(),
        shipmentCode: (j['shipmentCode'] ?? '') as String,
        status: (j['status'] ?? '') as String,
        driverId: (j['driverId'] ?? '').toString(),
        vehicleId: (j['vehicleId'] ?? '').toString(),
        totalDistanceKm: _d(j['totalDistanceKm']),
        stopCount: (j['stopCount'] as num?)?.toInt() ?? 0,
        deliveredCount: (j['deliveredCount'] as num?)?.toInt() ?? 0,
        dispatchedAt: _dtn(j['dispatchedAt']),
        createdAt: _dt(j['createdAt']),
      );
}
