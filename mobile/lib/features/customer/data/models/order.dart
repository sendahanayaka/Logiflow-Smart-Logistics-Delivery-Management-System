/// Customer order models — mirror the backend DTOs
/// (DeliveryOrderResponse, DeliveryFeeBreakdown, OrderIntelligenceResponse).

double _toDouble(dynamic v) => v == null ? 0 : (v as num).toDouble();

/// AI-derived package insights attached to an order (from the LLM triage step).
class OrderIntelligence {
  const OrderIntelligence({
    required this.volumeM3,
    required this.weightClassification,
    required this.handlingRequirement,
    required this.recommendedPriority,
    required this.risksOrAmbiguities,
  });

  final double volumeM3;
  final String weightClassification;
  final String handlingRequirement;
  final String recommendedPriority;
  final List<String> risksOrAmbiguities;

  factory OrderIntelligence.fromJson(Map<String, dynamic> j) => OrderIntelligence(
        volumeM3: _toDouble(j['volumeM3']),
        weightClassification: (j['weightClassification'] ?? '') as String,
        handlingRequirement: (j['handlingRequirement'] ?? '') as String,
        recommendedPriority: (j['recommendedPriority'] ?? '') as String,
        risksOrAmbiguities:
            ((j['risksOrAmbiguities'] as List?) ?? const []).map((e) => e.toString()).toList(),
      );
}

/// Delivery-fee breakdown (computed server-side, may arrive after order creation).
class Pricing {
  const Pricing({
    required this.baseFee,
    required this.distanceCharge,
    required this.weightCharge,
    required this.volumeCharge,
    required this.priorityCharge,
    required this.handlingCharge,
    required this.totalDeliveryFee,
  });

  final double baseFee;
  final double distanceCharge;
  final double weightCharge;
  final double volumeCharge;
  final double priorityCharge;
  final double handlingCharge;
  final double totalDeliveryFee;

  factory Pricing.fromJson(Map<String, dynamic> j) => Pricing(
        baseFee: _toDouble(j['baseFee']),
        distanceCharge: _toDouble(j['distanceCharge']),
        weightCharge: _toDouble(j['weightCharge']),
        volumeCharge: _toDouble(j['volumeCharge']),
        priorityCharge: _toDouble(j['priorityCharge']),
        handlingCharge: _toDouble(j['handlingCharge']),
        totalDeliveryFee: _toDouble(j['totalDeliveryFee']),
      );
}

/// A customer delivery order.
class Order {
  const Order({
    required this.id,
    required this.customerId,
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
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.intelligence,
    this.pricing,
  });

  final String id;
  final String customerId;
  final String pickupAddress;
  final String pickupCity;
  final String deliveryAddress;
  final String deliveryCity;
  final String packageDescription;
  final String? specialHandling;
  final DateTime preferredPickupDate;
  final String preferredPickupTime; // "HH:mm:ss" (backend TimeSpan)
  final String priority;
  final double weightKg;
  final double lengthCm;
  final double widthCm;
  final double heightCm;
  final String? recipientName;
  final String? recipientContact;
  final String status; // Pending | Confirmed | Cancelled
  final DateTime createdAt;
  final DateTime? updatedAt;
  final OrderIntelligence? intelligence;
  final Pricing? pricing;

  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isConfirmed => status.toUpperCase() == 'CONFIRMED';
  bool get isCancelled => status.toUpperCase() == 'CANCELLED';

  /// "HH:mm" for display, from the "HH:mm:ss" TimeSpan string.
  String get pickupTimeLabel =>
      preferredPickupTime.length >= 5 ? preferredPickupTime.substring(0, 5) : preferredPickupTime;

  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id: (j['id'] ?? '').toString(),
        customerId: (j['customerId'] ?? '').toString(),
        pickupAddress: (j['pickupAddress'] ?? '') as String,
        pickupCity: (j['pickupCity'] ?? '') as String,
        deliveryAddress: (j['deliveryAddress'] ?? '') as String,
        deliveryCity: (j['deliveryCity'] ?? '') as String,
        packageDescription: (j['packageDescription'] ?? '') as String,
        specialHandling: j['specialHandling'] as String?,
        preferredPickupDate:
            DateTime.tryParse((j['preferredPickupDate'] ?? '').toString()) ?? DateTime.now(),
        preferredPickupTime: (j['preferredPickupTime'] ?? '00:00:00').toString(),
        priority: (j['priority'] ?? 'Standard') as String,
        weightKg: _toDouble(j['weightKg']),
        lengthCm: _toDouble(j['lengthCm']),
        widthCm: _toDouble(j['widthCm']),
        heightCm: _toDouble(j['heightCm']),
        recipientName: j['recipientName'] as String?,
        recipientContact: j['recipientContact'] as String?,
        status: (j['status'] ?? '') as String,
        createdAt: DateTime.tryParse((j['createdAt'] ?? '').toString()) ?? DateTime.now(),
        updatedAt: j['updatedAt'] == null ? null : DateTime.tryParse(j['updatedAt'].toString()),
        intelligence: j['intelligence'] == null
            ? null
            : OrderIntelligence.fromJson(j['intelligence'] as Map<String, dynamic>),
        pricing: j['pricing'] == null ? null : Pricing.fromJson(j['pricing'] as Map<String, dynamic>),
      );
}
