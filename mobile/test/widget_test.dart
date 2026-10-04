import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logiflow_mobile/app.dart';

void main() {
  testWidgets('LogiFlowApp loads splash screen smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: LogiFlowApp(),
      ),
    );
    expect(find.byType(LogiFlowApp), findsOneWidget);
  });
}
