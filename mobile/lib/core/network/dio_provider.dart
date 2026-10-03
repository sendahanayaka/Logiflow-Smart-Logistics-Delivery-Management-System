import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/api_config.dart';
import '../storage/token_store.dart';
import '../auth/session_controller.dart';

/// A single Dio instance for the whole app:
///  - points at the backend (`ApiConfig.baseUrl`),
///  - attaches the JWT on every request,
///  - on 401, signs the user out (the router then redirects to login).
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  final tokenStore = ref.read(tokenStoreProvider);

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await tokenStore.read();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Expired/invalid session -> clear it; router redirects to /login.
          await ref.read(sessionControllerProvider.notifier).signOut();
        }
        handler.next(error);
      },
    ),
  );

  return dio;
});
