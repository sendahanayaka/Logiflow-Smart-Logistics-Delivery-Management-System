/// Customer-facing tracking for one order — mirrors CustomerOrderTrackingView.
/// Deliberately shows ONLY this order's stop + the assigned driver's contact;
/// never batching, routes, or other customers on the same van.
class CustomerTracking {
  const CustomerTracking({
    required this.orderId,
    required this.hasShipment,
    required this.stage,
    this.shipmentCode,
    this.shipmentStatus,
    this.driverName,
    this.driverContact,
    this.vehicleRegistration,
    this.stopSequence,
    this.eta,
    this.stopStatus,
    this.onTime,
    this.arrivedAt,
    this.deliveredAt,
    this.receivedByName,
    this.originLat,
    this.originLng,
    this.destinationLat,
    this.destinationLng,
  });

  final String orderId;
  final bool hasShipment;
  final String stage; // Preparing | AwaitingDispatch | Dispatched | InTransit | Delivered ...
  final String? shipmentCode;
  final String? shipmentStatus;
  final String? driverName;
  final String? driverContact;
  final String? vehicleRegistration;
  final int? stopSequence;
  final DateTime? eta;
  final String? stopStatus;
  final bool? onTime;
  final DateTime? arrivedAt;
  final DateTime? deliveredAt;
  final String? receivedByName;
  final double? originLat;
  final double? originLng;
  final double? destinationLat;
  final double? destinationLng;

  bool get isDelivered => deliveredAt != null || stage.toUpperCase() == 'DELIVERED';

  static DateTime? _date(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());
  static double? _num(dynamic v) => v == null ? null : (v as num).toDouble();

  factory CustomerTracking.fromJson(Map<String, dynamic> j) => CustomerTracking(
        orderId: (j['orderId'] ?? '').toString(),
        hasShipment: (j['hasShipment'] ?? false) as bool,
        stage: (j['stage'] ?? 'Preparing') as String,
        shipmentCode: j['shipmentCode'] as String?,
        shipmentStatus: j['shipmentStatus'] as String?,
        driverName: j['driverName'] as String?,
        driverContact: j['driverContact'] as String?,
        vehicleRegistration: j['vehicleRegistration'] as String?,
        stopSequence: (j['stopSequence'] as num?)?.toInt(),
        eta: _date(j['eta']),
        stopStatus: j['stopStatus'] as String?,
        onTime: j['onTime'] as bool?,
        arrivedAt: _date(j['arrivedAt']),
        deliveredAt: _date(j['deliveredAt']),
        receivedByName: j['receivedByName'] as String?,
        originLat: _num(j['originLat']),
        originLng: _num(j['originLng']),
        destinationLat: _num(j['destinationLat']),
        destinationLng: _num(j['destinationLng']),
      );
}
