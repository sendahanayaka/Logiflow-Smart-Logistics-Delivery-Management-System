import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logiflow_mobile/features/warehouse/data/models/warehouse_models.dart';
import 'package:logiflow_mobile/features/warehouse/data/tracking_code.dart';
import 'package:logiflow_mobile/features/warehouse/data/warehouse_repository.dart';
import 'package:logiflow_mobile/features/warehouse/presentation/warehouse_error.dart';
import 'package:logiflow_mobile/features/warehouse/presentation/warehouse_home_page.dart';

void main() {
  group('Warehouse API models', () {
    test('Warehouse parses integer and decimal volumes', () {
      final warehouse = Warehouse.fromJson(_warehouseJson());

      expect(warehouse.id, 'warehouse-1');
      expect(warehouse.totalVolumeM3, 100.0);
      expect(warehouse.occupiedVolumeM3, 20.5);
      expect(warehouse.updatedAt, isNull);
    });

    test('StorageZone parses API JSON', () {
      final zone = StorageZone.fromJson(_zoneJson());

      expect(zone.warehouseId, 'warehouse-1');
      expect(zone.code, 'A-01');
      expect(zone.occupiedVolumeM3, 2.25);
    });

    test('IntakeOrder parses the actual DeliveryOrderResponse fields it uses',
        () {
      final order = IntakeOrder.fromJson(_orderJson());

      expect(order.id, 'order-1');
      expect(order.displayLabel, 'order-1 · Books');
      expect(order.detailLabel, 'Colombo → Kandy · Sam');
    });

    test('WarehousePackage parses PackageResponse', () {
      final package = WarehousePackage.fromJson(_packageJson());

      expect(package.trackingCode, 'Qr-Mixed-9');
      expect(package.weightKg, 1.25);
      expect(package.isFragile, isTrue);
      expect(package.status, 'Received');
    });

    test('ReceivePackageRequest serializes the intake contract', () {
      const request = ReceivePackageRequest(
        orderId: 'order-1',
        warehouseId: 'warehouse-1',
        storageZoneId: 'zone-1',
        trackingCode: 'Qr-Mixed-9',
        weightKg: 1.25,
        volumeM3: 0.03,
        isFragile: true,
        specialHandling: 'Keep upright',
      );

      expect(request.toJson(), {
        'orderId': 'order-1',
        'warehouseId': 'warehouse-1',
        'storageZoneId': 'zone-1',
        'trackingCode': 'Qr-Mixed-9',
        'weightKg': 1.25,
        'volumeM3': 0.03,
        'isFragile': true,
        'specialHandling': 'Keep upright',
      });
    });
  });

  test('repository uses warehouse, zones, orders and intake API contracts',
      () async {
    final calls = <RequestOptions>[];
    final dio = Dio()
      ..interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
        calls.add(options);
        final data = switch (options.path) {
          '/warehouse' => [_warehouseJson()],
          '/warehouse/warehouse-1/zones' => [_zoneJson()],
          '/orders' => [_orderJson()],
          '/warehouse/intake' => _packageJson(),
          _ => <String, dynamic>{},
        };
        handler.resolve(Response<dynamic>(
            requestOptions: options, statusCode: 201, data: data));
      }));
    final repository = WarehouseRepository(dio);

    expect((await repository.getWarehouses()).single.name, 'Central warehouse');
    expect(
        (await repository.getStorageZones('warehouse-1')).single.id, 'zone-1');
    expect((await repository.getIntakeOrders()).single.id, 'order-1');
    final received =
        await repository.receivePackage(const ReceivePackageRequest(
      orderId: 'order-1',
      warehouseId: 'warehouse-1',
      storageZoneId: 'zone-1',
      trackingCode: 'Qr-Mixed-9',
      weightKg: 1.25,
      volumeM3: 0.03,
      isFragile: true,
      specialHandling: null,
    ));

    expect(received.id, 'package-1');
    expect(calls.map((call) => call.path), [
      '/warehouse',
      '/warehouse/warehouse-1/zones',
      '/orders',
      '/warehouse/intake',
    ]);
    expect(calls.last.method, 'POST');
    expect(calls.last.data, containsPair('trackingCode', 'Qr-Mixed-9'));
    expect(calls.last.data, containsPair('storageZoneId', 'zone-1'));
  });

  group('tracking code and intake validation', () {
    test('trims tracking codes while preserving case', () {
      expect(TrackingCode.normalize('  Qr-Mixed-9  '), 'Qr-Mixed-9');
      expect(TrackingCode.validate('  Qr-Mixed-9  '), isNull);
    });

    test('rejects blank and overlength tracking codes', () {
      expect(TrackingCode.validate('   '), isNotNull);
      expect(TrackingCode.validate('x' * 101), isNotNull);
    });

    test('intake form validator requires selections and positive dimensions',
        () {
      final errors = ReceivePackageFormValidator.validate(
        orderId: null,
        storageZoneId: null,
        trackingCode: 'CODE-1',
        weightKg: '0',
        volumeM3: '-1',
      );

      expect(errors.keys,
          containsAll(['orderId', 'storageZoneId', 'weightKg', 'volumeM3']));
    });
  });

  group('Warehouse API errors', () {
    DioException exception(int? status,
            {DioExceptionType type = DioExceptionType.badResponse}) =>
        DioException(
          requestOptions: RequestOptions(path: '/warehouse/intake'),
          type: type,
          response: status == null
              ? null
              : Response(
                  requestOptions: RequestOptions(path: '/warehouse/intake'),
                  statusCode: status),
        );

    test('maps validation errors', () {
      expect(warehouseErrorMessage(exception(400)), contains('correct'));
    });

    test('maps duplicate or capacity conflicts', () {
      expect(warehouseErrorMessage(exception(409)), contains('tracking code'));
    });

    test('maps network failures to a retry-friendly message', () {
      expect(
          warehouseErrorMessage(
              exception(null, type: DioExceptionType.connectionError)),
          contains('connection'));
    });
  });

  testWidgets('Warehouse home renders available warehouses', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          warehouseRepositoryProvider
              .overrideWithValue(_WarehouseHomeRepository())
        ],
        child: const MaterialApp(home: WarehouseHomePage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Central warehouse'), findsOneWidget);
    expect(find.textContaining('Colombo'), findsOneWidget);
  });
}

class _WarehouseHomeRepository extends WarehouseRepository {
  _WarehouseHomeRepository() : super(Dio());

  @override
  Future<List<Warehouse>> getWarehouses() async =>
      [Warehouse.fromJson(_warehouseJson())];
}

Map<String, dynamic> _warehouseJson() => {
      'id': 'warehouse-1',
      'name': 'Central warehouse',
      'location': 'Colombo',
      'totalVolumeM3': 100,
      'occupiedVolumeM3': 20.5,
      'createdAt': '2026-01-01T10:00:00Z',
      'updatedAt': null,
    };

Map<String, dynamic> _zoneJson() => {
      'id': 'zone-1',
      'warehouseId': 'warehouse-1',
      'name': 'Inbound A',
      'code': 'A-01',
      'totalVolumeM3': 10,
      'occupiedVolumeM3': 2.25,
      'createdAt': '2026-01-01T10:00:00Z',
      'updatedAt': null,
    };

Map<String, dynamic> _orderJson() => {
      'id': 'order-1',
      'customerId': 'customer-1',
      'pickupAddress': '1 Main Street',
      'pickupCity': 'Colombo',
      'deliveryAddress': '2 Hill Road',
      'deliveryCity': 'Kandy',
      'packageDescription': 'Books',
      'specialHandling': null,
      'preferredPickupDate': '2026-01-02T00:00:00Z',
      'preferredPickupTime': '09:00:00',
      'priority': 'Normal',
      'weightKg': 1.25,
      'lengthCm': 10,
      'widthCm': 10,
      'heightCm': 10,
      'recipientName': 'Sam',
      'recipientContact': null,
      'status': 'Confirmed',
      'createdAt': '2026-01-01T10:00:00Z',
      'updatedAt': null,
    };

Map<String, dynamic> _packageJson() => {
      'id': 'package-1',
      'orderId': 'order-1',
      'warehouseId': 'warehouse-1',
      'storageZoneId': 'zone-1',
      'trackingCode': 'Qr-Mixed-9',
      'weightKg': 1.25,
      'volumeM3': 0.03,
      'isFragile': true,
      'specialHandling': null,
      'status': 'Received',
      'receivedAt': '2026-01-01T11:00:00Z',
    };
