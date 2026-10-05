import 'dart:io' show Platform;

/// Where the mobile app finds the backend API.
///
/// A phone/emulator cannot use `localhost` to reach your dev machine:
///  - Android emulator  -> 10.0.2.2 maps to the host's localhost
///  - iOS simulator     -> localhost works
///  - Real device       -> use your machine's LAN IP (set API_HOST at build time:
///                         `flutter run --dart-define=API_HOST=192.168.1.50`)
class ApiConfig {
  /// Override at build time: `--dart-define=API_HOST=<ip>` and/or `API_PORT=<port>`.
  static const String _hostOverride = String.fromEnvironment('API_HOST');
  static const String _port = String.fromEnvironment('API_PORT', defaultValue: '5000');

  static String get _host {
    if (_hostOverride.isNotEmpty) return _hostOverride;
    try {
      if (Platform.isAndroid) return '10.0.2.2';
    } catch (_) {
      // Platform unavailable (tests) -> fall through.
    }
    return 'localhost';
  }

  /// Base URL including the `/api` prefix, e.g. http://10.0.2.2:5000/api
  static String get baseUrl {
    final scheme = _port == '443' ? 'https' : 'http';
    final portString = (_port == '80' || _port == '443') ? '' : ':$_port';
    return '$scheme://$_host$portString/api';
  }
}
