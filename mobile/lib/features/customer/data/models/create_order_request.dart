/// Payload for POST /orders — mirrors the backend CreateDeliveryOrderRequest.
class CreateOrderRequest {
  const CreateOrderRequest({
    required this.pickupAddress,
    required this.pickupCity,
    required this.deliveryAddress,
    required this.deliveryCity,
    required this.packageDescription,
    this.specialHandling,
    required this.preferredPickupDate,
    required this.preferredPickupTime,
    required this.priority,
    required this.weightKg,
    required this.lengthCm,
    required this.widthCm,
    required this.heightCm,
    this.recipientName,
    this.recipientContact,
  });

  final String pickupAddress;
  final String pickupCity;
  final String deliveryAddress;
  final String deliveryCity;
  final String packageDescription;
  final String? specialHandling;
  final DateTime preferredPickupDate;
  final Duration preferredPickupTime;
  final String priority;
  final double weightKg;
  final double lengthCm;
  final double widthCm;
  final double heightCm;
  final String? recipientName;
  final String? recipientContact;

  /// TimeSpan wire format expected by .NET: "HH:mm:ss".
  static String _timeSpan(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  Map<String, dynamic> toJson() => {
        'pickupAddress': pickupAddress,
        'pickupCity': pickupCity,
        'deliveryAddress': deliveryAddress,
        'deliveryCity': deliveryCity,
        'packageDescription': packageDescription,
        'specialHandling': specialHandling,
        // Send date-only portion so the backend's pickup-date rules are unambiguous.
        'preferredPickupDate': DateTime(
          preferredPickupDate.year,
          preferredPickupDate.month,
          preferredPickupDate.day,
        ).toIso8601String(),
        'preferredPickupTime': _timeSpan(preferredPickupTime),
        'priority': priority,
        'weightKg': weightKg,
        'lengthCm': lengthCm,
        'widthCm': widthCm,
        'heightCm': heightCm,
        'recipientName': recipientName,
        'recipientContact': recipientContact,
      };
}
