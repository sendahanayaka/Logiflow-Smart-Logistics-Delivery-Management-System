import 'package:dio/dio.dart';

/// A concise, safe message for known Warehouse API failures.
String warehouseErrorMessage(Object error,
    {String fallback = 'Unable to complete the request. Please try again.'}) {
  if (error is! DioException) return fallback;

  final status = error.response?.statusCode;
  final detail = _problemMessage(error.response?.data);
  switch (status) {
    case 400:
      return detail ?? 'Please correct the highlighted package details.';
    case 401:
      return 'Your session has ended. Please sign in again.';
    case 403:
      return 'You are not authorized to perform this Warehouse action.';
    case 404:
      return detail ?? 'The requested Warehouse resource was not found.';
    case 409:
      return detail ??
          'This tracking code already exists or the storage zone has insufficient capacity.';
  }
  if (error.type == DioExceptionType.connectionError ||
      error.type == DioExceptionType.connectionTimeout ||
      error.type == DioExceptionType.receiveTimeout ||
      error.type == DioExceptionType.sendTimeout) {
    return 'Unable to reach LogiFlow. Check your connection and try again.';
  }
  return detail ??
      (status == null
          ? 'Unable to reach LogiFlow. Please try again.'
          : fallback);
}

String? _problemMessage(Object? data) {
  if (data is! Map) return null;
  if (data['message'] is String) return data['message'] as String;
  if (data['title'] is String) return data['title'] as String;
  final errors = data['errors'];
  if (errors is Map) {
    final messages = errors.values
        .expand((value) => value is List ? value : [value])
        .whereType<String>();
    return messages.isEmpty ? null : messages.join(' ');
  }
  return null;
}
