import 'package:flutter/material.dart';

/// LogiFlow brand theme (navy + orange), shared across the app.
class AppTheme {
  static const navy = Color(0xFF08006C);
  static const orange = Color(0xFFFD5901);

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: navy,
      primary: navy,
      secondary: orange,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      appBarTheme: const AppBarTheme(backgroundColor: navy, foregroundColor: Colors.white),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(backgroundColor: orange, foregroundColor: Colors.white),
      ),
      inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
    );
  }
}
