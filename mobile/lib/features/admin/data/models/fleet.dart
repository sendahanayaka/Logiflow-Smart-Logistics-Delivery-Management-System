// Fleet models — mirror the backend DriverResponse / VehicleResponse.
// Note: Status is serialized as an INT (no string-enum converter on the API).

DateTime _dt(dynamic v) => DateTime.tryParse((v ?? '').toString()) ?? DateTime.now();
DateTime? _dtn(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());
double _d(dynamic v) => v == null ? 0 : (v as num).toDouble();

const _driverStatus = ['Off duty', 'Available', 'On duty', 'On delivery', 'Suspended', 'Inactive'];
const _vehicleStatus = ['Available', 'In transit', 'In maintenance', 'Out of service', 'Decommissioned'];

String _label(List<String> table, int i) => (i >= 0 && i < table.length) ? table[i] : 'Unknown';

class Driver {
  const Driver({
    required this.id,
    this.userId,
    required this.fullName,
    required this.licenseNumber,
    required this.licenseExpiryDate,
    this.phoneNumber,
    required this.status,
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? userId;
  final String fullName;
  final String licenseNumber;
  final DateTime licenseExpiryDate;
  final String? phoneNumber;
  final int status;
  final DateTime createdAt;
  final DateTime? updatedAt;

  String get statusLabel => _label(_driverStatus, status);

  factory Driver.fromJson(Map<String, dynamic> j) => Driver(
        id: (j['id'] ?? '').toString(),
        userId: j['userId']?.toString(),
        fullName: (j['fullName'] ?? '') as String,
        licenseNumber: (j['licenseNumber'] ?? '') as String,
        licenseExpiryDate: _dt(j['licenseExpiryDate']),
        phoneNumber: j['phoneNumber'] as String?,
        status: (j['status'] as num?)?.toInt() ?? 0,
        createdAt: _dt(j['createdAt']),
        updatedAt: _dtn(j['updatedAt']),
      );
}

class Vehicle {
  const Vehicle({
    required this.id,
    required this.registrationNumber,
    required this.vehicleType,
    required this.make,
    required this.model,
    required this.capacity,
    required this.status,
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String registrationNumber;
  final String vehicleType;
  final String make;
  final String model;
  final double capacity;
  final int status;
  final DateTime createdAt;
  final DateTime? updatedAt;

  String get statusLabel => _label(_vehicleStatus, status);

  factory Vehicle.fromJson(Map<String, dynamic> j) => Vehicle(
        id: (j['id'] ?? '').toString(),
        registrationNumber: (j['registrationNumber'] ?? '') as String,
        vehicleType: (j['vehicleType'] ?? '') as String,
        make: (j['make'] ?? '') as String,
        model: (j['model'] ?? '') as String,
        capacity: _d(j['capacity']),
        status: (j['status'] as num?)?.toInt() ?? 0,
        createdAt: _dt(j['createdAt']),
        updatedAt: _dtn(j['updatedAt']),
      );
}
