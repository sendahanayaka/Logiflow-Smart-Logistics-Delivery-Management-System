import 'package:flutter/foundation.dart';

@immutable
class ShipmentSummary {
  final String id;
  final String shipmentCode;
  final String status;
  final String driverId;
  final String vehicleId;
  final double totalDistanceKm;
  final int stopCount;
  final int deliveredCount;
  final DateTime? dispatchedAt;
  final DateTime? createdAt;

  const ShipmentSummary({
    required this.id,
    required this.shipmentCode,
    required this.status,
    required this.driverId,
    required this.vehicleId,
    required this.totalDistanceKm,
    required this.stopCount,
    required this.deliveredCount,
    this.dispatchedAt,
    this.createdAt,
  });

  factory ShipmentSummary.fromJson(Map<String, dynamic> json) {
    return ShipmentSummary(
      id: (json['id'] ?? json['shipmentId'] ?? '').toString(),
      shipmentCode: (json['shipmentCode'] ?? '').toString(),
      status: (json['status'] ?? 'Created').toString(),
      driverId: (json['driverId'] ?? '').toString(),
      vehicleId: (json['vehicleId'] ?? '').toString(),
      totalDistanceKm: (json['totalDistanceKm'] as num?)?.toDouble() ?? 0.0,
      stopCount: (json['stopCount'] as num?)?.toInt() ?? 0,
      deliveredCount: (json['deliveredCount'] as num?)?.toInt() ?? 0,
      dispatchedAt: json['dispatchedAt'] != null
          ? DateTime.tryParse(json['dispatchedAt'].toString())
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }
}

@immutable
class TimelineEntry {
  final int sequence;
  final String stopKey;
  final String address;
  final DateTime? plannedEta;
  final String status;
  final DateTime? actualAt;
  final String? note;
  final bool? onTime;
  final double? latitude;
  final double? longitude;
  final double? distanceFromPrevKm;
  final String? recipientName;
  final String? recipientContact;

  const TimelineEntry({
    required this.sequence,
    required this.stopKey,
    required this.address,
    this.plannedEta,
    required this.status,
    this.actualAt,
    this.note,
    this.onTime,
    this.latitude,
    this.longitude,
    this.distanceFromPrevKm,
    this.recipientName,
    this.recipientContact,
  });

  factory TimelineEntry.fromJson(Map<String, dynamic> json) {
    return TimelineEntry(
      sequence: (json['sequence'] as num?)?.toInt() ?? 0,
      stopKey: (json['stopKey'] ?? '').toString(),
      address: (json['address'] ?? '').toString(),
      plannedEta: json['plannedEta'] != null
          ? DateTime.tryParse(json['plannedEta'].toString())
          : null,
      status: (json['status'] ?? 'Pending').toString(),
      actualAt: json['actualAt'] != null
          ? DateTime.tryParse(json['actualAt'].toString())
          : null,
      note: json['note']?.toString(),
      onTime: json['onTime'] as bool?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      distanceFromPrevKm: (json['distanceFromPrevKm'] as num?)?.toDouble(),
      recipientName: json['recipientName']?.toString(),
      recipientContact: json['recipientContact']?.toString(),
    );
  }
}

@immutable
class DriverRunView {
  final String shipmentId;
  final String shipmentCode;
  final String status;
  final String driverId;
  final String vehicleId;
  final List<TimelineEntry> stops;

  const DriverRunView({
    required this.shipmentId,
    required this.shipmentCode,
    required this.status,
    required this.driverId,
    required this.vehicleId,
    required this.stops,
  });

  factory DriverRunView.fromJson(Map<String, dynamic> json) {
    final rawStops = json['stops'] as List<dynamic>? ?? [];
    final parsedStops = rawStops
        .map((s) => TimelineEntry.fromJson(s as Map<String, dynamic>))
        .toList();
    parsedStops.sort((a, b) => a.sequence.compareTo(b.sequence));

    return DriverRunView(
      shipmentId: (json['shipmentId'] ?? json['id'] ?? '').toString(),
      shipmentCode: (json['shipmentCode'] ?? '').toString(),
      status: (json['status'] ?? 'Created').toString(),
      driverId: (json['driverId'] ?? '').toString(),
      vehicleId: (json['vehicleId'] ?? '').toString(),
      stops: parsedStops,
    );
  }

  /// Active stop = first stop that isn't Delivered or Skipped.
  TimelineEntry? get activeStop {
    for (final stop in stops) {
      final s = stop.status.toLowerCase();
      if (s != 'delivered' && s != 'skipped') {
        return stop;
      }
    }
    return null;
  }

  bool get isCompleted => activeStop == null && stops.isNotEmpty;
}
