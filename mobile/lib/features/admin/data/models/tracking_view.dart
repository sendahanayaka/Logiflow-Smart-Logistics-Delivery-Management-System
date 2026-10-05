// Shipment tracking timeline — mirrors the backend TrackingView / TimelineEntry.
// Admin sees ALL stops on the shipment (unlike the customer's single-stop view).

double _d(dynamic v) => v == null ? 0 : (v as num).toDouble();
DateTime _dt(dynamic v) => DateTime.tryParse((v ?? '').toString()) ?? DateTime.now();
DateTime? _dtn(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());

class TimelineEntry {
  const TimelineEntry({
    required this.sequence,
    required this.stopKey,
    required this.address,
    required this.plannedEta,
    required this.status,
    this.actualAt,
    this.note,
    this.onTime,
    required this.distanceFromPrevKm,
    this.recipientName,
    this.recipientContact,
  });

  final int sequence;
  final String stopKey;
  final String address;
  final DateTime plannedEta;
  final String status; // Pending|EnRoute|Arrived|Delivered|Skipped
  final DateTime? actualAt;
  final String? note;
  final bool? onTime;
  final double distanceFromPrevKm;
  final String? recipientName;
  final String? recipientContact;

  factory TimelineEntry.fromJson(Map<String, dynamic> j) => TimelineEntry(
        sequence: (j['sequence'] as num?)?.toInt() ?? 0,
        stopKey: (j['stopKey'] ?? '') as String,
        address: (j['address'] ?? '') as String,
        plannedEta: _dt(j['plannedEta']),
        status: (j['status'] ?? '') as String,
        actualAt: _dtn(j['actualAt']),
        note: j['note'] as String?,
        onTime: j['onTime'] as bool?,
        distanceFromPrevKm: _d(j['distanceFromPrevKm']),
        recipientName: j['recipientName'] as String?,
        recipientContact: j['recipientContact'] as String?,
      );
}

class TrackingView {
  const TrackingView({
    required this.shipmentId,
    required this.shipmentCode,
    required this.status,
    required this.stops,
  });

  final String shipmentId;
  final String shipmentCode;
  final String status;
  final List<TimelineEntry> stops;

  factory TrackingView.fromJson(Map<String, dynamic> j) => TrackingView(
        shipmentId: (j['shipmentId'] ?? '').toString(),
        shipmentCode: (j['shipmentCode'] ?? '') as String,
        status: (j['status'] ?? '') as String,
        stops: ((j['stops'] as List?) ?? const [])
            .map((e) => TimelineEntry.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
