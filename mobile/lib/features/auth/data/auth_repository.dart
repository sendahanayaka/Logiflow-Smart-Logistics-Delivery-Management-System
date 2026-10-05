import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/auth_user.dart';
import '../../../core/network/dio_provider.dart';

/// Auth API: /api/auth/{login,register,me}. Returns the token + user.
class AuthRepository {
  AuthRepository(this._dio);
  final Dio _dio;

  /// POST /api/auth/login -> { token, user }
  Future<({String token, AuthUser user})> login(String email, String password) async {
    final res = await _dio.post('/auth/login', data: {'email': email, 'password': password});
    final data = res.data as Map<String, dynamic>;
    return (token: data['token'] as String, user: AuthUser.fromJson(data['user'] as Map<String, dynamic>));
  }

  /// POST /api/auth/register -> { token, user }.
  /// Public registration is CUSTOMER-only; the backend assigns the role, so no
  /// roleId is sent. Admins create drivers / warehouse staff via the Users API.
  Future<({String token, AuthUser user})> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final res = await _dio.post('/auth/register', data: {
      'name': name,
      'email': email,
      'password': password,
    });
    final data = res.data as Map<String, dynamic>;
    return (token: data['token'] as String, user: AuthUser.fromJson(data['user'] as Map<String, dynamic>));
  }

  /// GET /api/auth/me -> user (used to restore the session from a stored token).
  Future<AuthUser> me() async {
    final res = await _dio.get('/auth/me');
    return AuthUser.fromJson(res.data as Map<String, dynamic>);
  }
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(dioProvider)),
);
