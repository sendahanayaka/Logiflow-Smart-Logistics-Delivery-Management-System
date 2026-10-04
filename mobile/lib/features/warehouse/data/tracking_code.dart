/// Normalization and validation shared by QR scan and manual code entry.
class TrackingCode {
  static const maxLength = 100;

  static String normalize(String value) => value.trim();

  static String? validate(String value) {
    final normalized = normalize(value);
    if (normalized.isEmpty) {
      return 'Tracking code is required.';
    }
    if (normalized.length > maxLength) {
      return 'Tracking code must be 100 characters or fewer.';
    }
    return null;
  }
}

/// Validation which mirrors the server's intake validator before a request is
/// sent. Server validation remains the source of truth.
class ReceivePackageFormValidator {
  static Map<String, String> validate({
    required String? orderId,
    required String? storageZoneId,
    required String trackingCode,
    required String weightKg,
    required String volumeM3,
  }) {
    final errors = <String, String>{};
    final trackingError = TrackingCode.validate(trackingCode);
    if (trackingError != null) {
      errors['trackingCode'] = trackingError;
    }
    if (orderId == null || orderId.isEmpty) {
      errors['orderId'] = 'Select an order.';
    }
    if (storageZoneId == null || storageZoneId.isEmpty) {
      errors['storageZoneId'] = 'Select a storage zone.';
    }
    if ((double.tryParse(weightKg) ?? 0) <= 0) {
      errors['weightKg'] = 'Weight must be greater than zero.';
    }
    if ((double.tryParse(volumeM3) ?? 0) <= 0) {
      errors['volumeM3'] = 'Volume must be greater than zero.';
    }
    return errors;
  }
}
