// User-admin models — mirror the backend UserResponse / RoleResponse.

DateTime _dt(dynamic v) => DateTime.tryParse((v ?? '').toString()) ?? DateTime.now();

class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.roleId,
    required this.isActive,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String email;
  final String role; // role name
  final String roleId;
  final bool isActive;
  final DateTime createdAt;

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: (j['id'] ?? '').toString(),
        name: (j['name'] ?? '') as String,
        email: (j['email'] ?? '') as String,
        role: (j['role'] ?? '') as String,
        roleId: (j['roleId'] ?? '').toString(),
        isActive: (j['isActive'] ?? true) as bool,
        createdAt: _dt(j['createdAt']),
      );
}

class Role {
  const Role({required this.id, required this.name});
  final String id;
  final String name;

  factory Role.fromJson(Map<String, dynamic> j) =>
      Role(id: (j['id'] ?? '').toString(), name: (j['name'] ?? '') as String);
}
