import 'user_role.dart';

/// The signed-in user (from /api/auth/login and /api/auth/me).
class AuthUser {
  const AuthUser({required this.id, required this.name, required this.email, required this.role});

  final String id;
  final String name;
  final String email;
  final UserRole role;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      role: UserRole.fromString(json['role'] as String?),
    );
  }
}
