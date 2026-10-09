import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logiflow_mobile/core/storage/token_store.dart';
import 'package:logiflow_mobile/features/driver/data/driver_repository.dart';
import 'package:logiflow_mobile/features/driver/data/models/driver_models.dart';
import 'package:logiflow_mobile/features/driver/presentation/driver_runs_page.dart';

/// [S4] Widget tests for the driver's "My Runs" screen. The driver repository and
/// the token store are overridden so the screen renders from canned data with no
/// network or secure-storage (platform channel) access.
class _FakeDriverRepo extends DriverRepository {
  _FakeDriverRepo(this.runs) : super(Dio());
  final List<ShipmentSummary> runs;

  @override
  Future<List<ShipmentSummary>> myRuns() async => runs;
}

class _FakeTokenStore extends TokenStore {
  _FakeTokenStore() : super(const FlutterSecureStorage());

  @override
  Future<String?> read() async => null; // unauthenticated → session restore no-ops

  @override
  Future<void> write(String token) async {}

  @override
  Future<void> clear() async {}
}

Widget _app(List<ShipmentSummary> runs) => ProviderScope(
      overrides: [
        tokenStoreProvider.overrideWithValue(_FakeTokenStore()),
        driverRepositoryProvider.overrideWithValue(_FakeDriverRepo(runs)),
      ],
      child: const MaterialApp(home: DriverRunsPage()),
    );

void main() {
  group('DriverRunsPage (S4 widget)', () {
    // MOB-W-01 (widget / UI-state): assigned runs render with code and progress.
    testWidgets('renders assigned runs with code and stop progress',
        (tester) async {
      await tester.pumpWidget(_app(const [
        ShipmentSummary(
          id: 'ship-1',
          shipmentCode: 'SHP-M-001',
          status: 'InTransit',
          driverId: 'd1',
          vehicleId: 'v1',
          totalDistanceKm: 12.0,
          stopCount: 4,
          deliveredCount: 1,
        ),
      ]));
      await tester.pumpAndSettle();

      expect(find.text('SHP-M-001'), findsOneWidget);
      expect(find.textContaining('1 / 4'), findsOneWidget);
    });

    // MOB-W-02 (widget / empty state): no runs shows the empty-state message.
    testWidgets('shows the empty state when there are no runs', (tester) async {
      await tester.pumpWidget(_app(const []));
      await tester.pumpAndSettle();

      expect(find.text('No delivery runs yet'), findsOneWidget);
    });
  });
}
