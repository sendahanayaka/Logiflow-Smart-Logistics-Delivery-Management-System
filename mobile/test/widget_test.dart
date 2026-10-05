// Minimal smoke test — the full app needs a running backend, so this just
// verifies the widget tree builds. Feature tests live per-feature.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('MaterialApp builds', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: Text('LogiFlow'))));
    expect(find.text('LogiFlow'), findsOneWidget);
  });
}
