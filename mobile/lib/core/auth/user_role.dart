/// The four LogiFlow roles (uppercase on the wire, in the JWT `role` claim).
enum UserRole {
  admin,
  customer,
  warehouseStaff,
  driver,
  unknown;

  static UserRole fromString(String? value) {
    switch ((value ?? '').toUpperCase()) {
      case 'ADMIN':
        return UserRole.admin;
      case 'CUSTOMER':
        return UserRole.customer;
      case 'WAREHOUSE_STAFF':
        return UserRole.warehouseStaff;
      case 'DRIVER':
        return UserRole.driver;
      default:
        return UserRole.unknown;
    }
  }

  /// Role id seeded by the backend (used when registering).
  String get roleId {
    switch (this) {
      case UserRole.admin:
        return '11111111-1111-1111-1111-111111111111';
      case UserRole.customer:
        return '22222222-2222-2222-2222-222222222222';
      case UserRole.warehouseStaff:
        return '33333333-3333-3333-3333-333333333333';
      case UserRole.driver:
        return '44444444-4444-4444-4444-444444444444';
      case UserRole.unknown:
        return '';
    }
  }
}
