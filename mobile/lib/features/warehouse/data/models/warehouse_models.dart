/// Typed representations of the Warehouse and Orders API DTOs.
///
/// ASP.NET Core serializes these properties using camelCase JSON names. Numeric
/// values are deliberately read as [num] because a value can be encoded as an
/// integer or decimal depending on its value.
class Warehouse {
  const Warehouse({
    required this.id,
    required this.name,
    required this.location,
    required this.totalVolumeM3,
    required this.occupiedVolumeM3,
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String name;
  final String location;
  final double totalVolumeM3;
  final double occupiedVolumeM3;
  final DateTime createdAt;
  final DateTime? updatedAt;

  factory Warehouse.fromJson(Map<String, dynamic> json) => Warehouse(
        id: json['id'].toString(),
        name: json['name'] as String,
        location: json['location'] as String,
        totalVolumeM3: _double(json['totalVolumeM3']),
        occupiedVolumeM3: _double(json['occupiedVolumeM3']),
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: _dateOrNull(json['updatedAt']),
      );
}

class StorageZone {
  const StorageZone({
    required this.id,
    required this.warehouseId,
    required this.name,
    required this.code,
    required this.totalVolumeM3,
    required this.occupiedVolumeM3,
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String warehouseId;
  final String name;
  final String code;
  final double totalVolumeM3;
  final double occupiedVolumeM3;
  final DateTime createdAt;
  final DateTime? updatedAt;

  factory StorageZone.fromJson(Map<String, dynamic> json) => StorageZone(
        id: json['id'].toString(),
        warehouseId: json['warehouseId'].toString(),
        name: json['name'] as String,
        code: json['code'] as String,
        totalVolumeM3: _double(json['totalVolumeM3']),
        occupiedVolumeM3: _double(json['occupiedVolumeM3']),
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: _dateOrNull(json['updatedAt']),
      );
}

/// The fields used from the actual DeliveryOrderResponse returned by GET
/// /orders. The remaining response fields are not needed to choose an order
/// for warehouse intake.
class IntakeOrder {
  const IntakeOrder({
    required this.id,
    required this.pickupAddress,
    required this.pickupCity,
    required this.deliveryAddress,
    required this.deliveryCity,
    required this.packageDescription,
    required this.status,
    this.recipientName,
  });

  final String id;
  final String pickupAddress;
  final String pickupCity;
  final String deliveryAddress;
  final String deliveryCity;
  final String packageDescription;
  final String status;
  final String? recipientName;

  String get displayLabel => '$id · $packageDescription';
  String get detailLabel =>
      '$pickupCity → $deliveryCity${recipientName == null ? '' : ' · $recipientName'}';

  factory IntakeOrder.fromJson(Map<String, dynamic> json) => IntakeOrder(
        id: json['id'].toString(),
        pickupAddress: json['pickupAddress'] as String,
        pickupCity: json['pickupCity'] as String,
        deliveryAddress: json['deliveryAddress'] as String,
        deliveryCity: json['deliveryCity'] as String,
        packageDescription: json['packageDescription'] as String,
        status: json['status'] as String,
        recipientName: json['recipientName'] as String?,
      );
}

class ReceivePackageRequest {
  const ReceivePackageRequest({
    required this.orderId,
    required this.warehouseId,
    required this.storageZoneId,
    required this.trackingCode,
    required this.weightKg,
    required this.volumeM3,
    required this.isFragile,
    this.specialHandling,
  });

  final String orderId;
  final String warehouseId;
  final String storageZoneId;
  final String trackingCode;
  final double weightKg;
  final double volumeM3;
  final bool isFragile;
  final String? specialHandling;

  Map<String, dynamic> toJson() => {
        'orderId': orderId,
        'warehouseId': warehouseId,
        'storageZoneId': storageZoneId,
        'trackingCode': trackingCode,
        'weightKg': weightKg,
        'volumeM3': volumeM3,
        'isFragile': isFragile,
        'specialHandling': specialHandling,
      };
}

class WarehousePackage {
  const WarehousePackage({
    required this.id,
    required this.orderId,
    required this.warehouseId,
    required this.storageZoneId,
    required this.trackingCode,
    required this.weightKg,
    required this.volumeM3,
    required this.isFragile,
    required this.status,
    required this.receivedAt,
    this.specialHandling,
  });

  final String id;
  final String orderId;
  final String warehouseId;
  final String storageZoneId;
  final String trackingCode;
  final double weightKg;
  final double volumeM3;
  final bool isFragile;
  final String? specialHandling;
  final String status;
  final DateTime receivedAt;

  factory WarehousePackage.fromJson(Map<String, dynamic> json) =>
      WarehousePackage(
        id: json['id'].toString(),
        orderId: json['orderId'].toString(),
        warehouseId: json['warehouseId'].toString(),
        storageZoneId: json['storageZoneId'].toString(),
        trackingCode: json['trackingCode'] as String,
        weightKg: _double(json['weightKg']),
        volumeM3: _double(json['volumeM3']),
        isFragile: json['isFragile'] as bool,
        specialHandling: json['specialHandling'] as String?,
        status: json['status'] as String,
        receivedAt: DateTime.parse(json['receivedAt'] as String),
      );
}

double _double(Object? value) => (value as num).toDouble();

DateTime? _dateOrNull(Object? value) =>
    value == null ? null : DateTime.parse(value as String);
