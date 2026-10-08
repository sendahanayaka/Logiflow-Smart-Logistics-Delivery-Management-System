import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:logiflow_mobile/features/customer/data/customer_repository.dart';
import 'package:logiflow_mobile/features/customer/data/models/create_order_request.dart';
import 'package:logiflow_mobile/features/customer/data/models/order.dart';
import 'package:dio/dio.dart';
import 'package:logiflow_mobile/features/customer/presentation/checkout_page.dart';
import 'package:logiflow_mobile/features/customer/presentation/tabs/customer_orders_tab.dart';
import 'package:logiflow_mobile/features/customer/presentation/tabs/new_order_tab.dart';

class FakeCustomerRepository implements CustomerRepository {
  List<Order> orders = [];
  bool checkoutShouldFail = false;

  @override
  Future<List<Order>> myOrders() async => orders;

  @override
  Future<Order> createOrder(CreateOrderRequest request) async {
    final o = Order(
      id: 'o-new-123',
      customerId: 'c-1',
      pickupAddress: request.pickupAddress,
      pickupCity: request.pickupCity,
      deliveryAddress: request.deliveryAddress,
      deliveryCity: request.deliveryCity,
      packageDescription: request.packageDescription,
      preferredPickupDate: request.preferredPickupDate,
      preferredPickupTime:
          '${request.preferredPickupTime.inHours.toString().padLeft(2, '0')}:${(request.preferredPickupTime.inMinutes % 60).toString().padLeft(2, '0')}:00',
      priority: request.priority,
      weightKg: request.weightKg,
      lengthCm: request.lengthCm,
      widthCm: request.widthCm,
      heightCm: request.heightCm,
      status: 'Pending',
      createdAt: DateTime.now(),
    );
    orders.add(o);
    return o;
  }

  @override
  Future<Order> orderById(String id) async {
    return orders.firstWhere((o) => o.id == id,
        orElse: () => throw Exception('Order not found'));
  }

  @override
  Future<Order> checkout(String id, String paymentMethod) async {
    if (checkoutShouldFail) throw Exception('500 Server Error');
    return orders.firstWhere((o) => o.id == id);
  }

  @override
  Future<Order> cancel(String id) async {
    return orders.firstWhere((o) => o.id == id);
  }

  // ignore: annotate_overrides
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class FakeDio extends Fake implements Dio {
  Map<String, dynamic> mockResponse = {};
  dynamic capturedData;
  String? capturedPath;

  @override
  Future<Response<T>> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    void Function(int, int)? onSendProgress,
    void Function(int, int)? onReceiveProgress,
  }) async {
    capturedPath = path;
    capturedData = data;
    return Response(
      requestOptions: RequestOptions(path: path),
      data: mockResponse as T,
      statusCode: 201,
    );
  }
}

Widget makeTestableWidget(Widget child, FakeCustomerRepository repo) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (context, state) => Scaffold(body: child)),
      GoRoute(
          path: '/customer/order/:id/checkout',
          builder: (context, state) =>
              const Scaffold(body: Text('Checkout Mock Route'))),
      GoRoute(
          path: '/customer/order/:id/success',
          builder: (context, state) => const Scaffold(body: Text('Success Route'))),
    ],
  );

  return ProviderScope(
    overrides: [
      customerRepositoryProvider.overrideWithValue(repo),
    ],
    child: MaterialApp.router(
      routerConfig: router,
    ),
  );
}

void main() {
  group('Customer & Delivery Orders Widget Tests', () {
    testWidgets('NORMAL CASE - Customer order form', (tester) async {
      final repo = FakeCustomerRepository();
      
      await tester.pumpWidget(makeTestableWidget(const NewOrderTab(), repo));
      await tester.pumpAndSettle();

      // Enter required fields
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Pickup address'), '123 Test St');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Pickup city'), 'Test City');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Delivery address'), '456 Dest St');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Delivery city'), 'Dest City');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Description'), 'A laptop box');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Weight (kg)'), '2.5');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Length (cm)'), '40');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Width (cm)'), '30');
      await tester.enterText(
          find.widgetWithText(TextFormField, 'Height (cm)'), '10');

      // Scroll to the submit button
      await tester.drag(find.byType(ListView), const Offset(0, -1000));
      await tester.pumpAndSettle();
      final submitButton = find.text('Create order');
      await tester.ensureVisible(submitButton);

      // Submit
      await tester.tap(submitButton);
      await tester.pumpAndSettle();

      // Verify the snackbar and the navigation route
      expect(find.text('Order created. Review the fee and check out.'), findsOneWidget);
      expect(find.text('Checkout Mock Route'), findsOneWidget); // Navigates out
      
      // Verify repo was updated
      expect(repo.orders.length, 1);
      expect(repo.orders[0].deliveryCity, 'Dest City');
    });

    testWidgets('INVALID / VALIDATION CASE - Required fields', (tester) async {
      final repo = FakeCustomerRepository();
      
      await tester.pumpWidget(makeTestableWidget(const NewOrderTab(), repo));
      await tester.pumpAndSettle();

      // Scroll to submit without data
      await tester.drag(find.byType(ListView), const Offset(0, -1000));
      await tester.pumpAndSettle();
      final submitButton = find.text('Create order');
      await tester.ensureVisible(submitButton);
      await tester.tap(submitButton);
      await tester.pumpAndSettle();
      
      // Scroll back up to see the validation messages
      await tester.drag(find.byType(ListView), const Offset(0, 1000));
      await tester.pumpAndSettle();

      // Verify native validation constraints fire and repository is not called
      expect(find.text('Weight is required.'), findsOneWidget);
      expect(find.text('Description is required.'), findsOneWidget);

      expect(repo.orders.length, 0); // Should not have created any order
    });

    testWidgets('FAILURE CASE - Checkout API failure', (tester) async {
      final repo = FakeCustomerRepository();
      repo.orders = [
        Order(
          id: 'mock-order-id',
          customerId: 'test-c',
          pickupAddress: 'A',
          pickupCity: 'B',
          deliveryAddress: 'C',
          deliveryCity: 'D',
          packageDescription: 'E',
          preferredPickupDate: DateTime.now(),
          preferredPickupTime: '10:00:00',
          priority: 'Standard',
          weightKg: 1,
          lengthCm: 1,
          widthCm: 1,
          heightCm: 1,
          status: 'Pending',
          createdAt: DateTime.now(),
        )
      ];
      repo.checkoutShouldFail = true;

      await tester.pumpWidget(makeTestableWidget(const CheckoutPage(orderId: 'mock-order-id'), repo));
      await tester.pumpAndSettle();

      // Select method
      await tester.tap(find.text('Cash on Pickup'));
      await tester.pumpAndSettle();

      // Submit
      await tester.drag(find.byType(ListView), const Offset(0, -1000));
      await tester.pumpAndSettle();
      final confirmButton = find.text('Confirm Order & Pay');
      await tester.ensureVisible(confirmButton);
      await tester.tap(confirmButton);
      await tester.pumpAndSettle();

      // Assert that app didn't crash and error is shown
      expect(find.textContaining('Checkout failed. Please try again.'), findsOneWidget);
      expect(find.text('Success Route'), findsNothing); // Should not navigate
    });

    testWidgets('NORMAL / DATA RENDERING CASE - Customer order list', (tester) async {
      final repo = FakeCustomerRepository();
      repo.orders = [
        Order(
          id: 'o1',
          customerId: 'test-c',
          pickupAddress: 'A',
          pickupCity: 'B',
          deliveryAddress: 'C',
          deliveryCity: 'Colombo',
          packageDescription: 'Gaming PC',
          preferredPickupDate: DateTime.now(),
          preferredPickupTime: '10:00:00',
          priority: 'Express',
          weightKg: 10,
          lengthCm: 1,
          widthCm: 1,
          heightCm: 1,
          status: 'Pending',
          createdAt: DateTime.now(),
        ),
        Order(
          id: 'o2',
          customerId: 'test-c',
          pickupAddress: 'X',
          pickupCity: 'Y',
          deliveryAddress: 'Z',
          deliveryCity: 'Kandy',
          packageDescription: 'Books',
          preferredPickupDate: DateTime.now(),
          preferredPickupTime: '12:00:00',
          priority: 'Standard',
          weightKg: 5,
          lengthCm: 1,
          widthCm: 1,
          heightCm: 1,
          status: 'Confirmed',
          createdAt: DateTime.now(),
        ),
      ];

      await tester.pumpWidget(makeTestableWidget(const CustomerOrdersTab(), repo));
      await tester.pumpAndSettle();

      // Verify that 2 cards rendered with correct texts
      expect(find.text('Gaming PC'), findsOneWidget);
      expect(find.text('Books'), findsOneWidget);
      expect(find.text('Pending'), findsOneWidget); 
      expect(find.text('Confirmed'), findsOneWidget);
    });

    testWidgets('INVALID / BOUNDARY CASE - Negative dimensions', (tester) async {
      final repo = FakeCustomerRepository();
      await tester.pumpWidget(makeTestableWidget(const NewOrderTab(), repo));
      await tester.pumpAndSettle();

      await tester.enterText(find.widgetWithText(TextFormField, 'Pickup address'), 'A');
      await tester.enterText(find.widgetWithText(TextFormField, 'Pickup city'), 'B');
      await tester.enterText(find.widgetWithText(TextFormField, 'Delivery address'), 'C');
      await tester.enterText(find.widgetWithText(TextFormField, 'Delivery city'), 'D');
      await tester.enterText(find.widgetWithText(TextFormField, 'Description'), 'Desc');
      await tester.enterText(find.widgetWithText(TextFormField, 'Weight (kg)'), '-5');
      await tester.enterText(find.widgetWithText(TextFormField, 'Length (cm)'), '0');
      
      await tester.drag(find.byType(ListView), const Offset(0, -1000));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Create order'));
      await tester.pumpAndSettle();

      await tester.drag(find.byType(ListView), const Offset(0, 1000));
      await tester.pumpAndSettle();

      // Ensure form rejected negative and zero values explicitly
      expect(find.text('Weight must be greater than zero.'), findsOneWidget);
      expect(find.text('Length must be greater than zero.'), findsOneWidget);
      expect(repo.orders.length, 0); // No execution allowed
    });
  });

  group('Customer & Delivery Orders Logic Tests', () {
    test('UNIT LOGIC - Request Serialization', () {
      final request = CreateOrderRequest(
        pickupAddress: 'A',
        pickupCity: 'B',
        deliveryAddress: 'C',
        deliveryCity: 'D',
        packageDescription: 'Desc',
        preferredPickupDate: DateTime(2025, 1, 1, 15, 30), // Time should be extracted
        preferredPickupTime: const Duration(hours: 14, minutes: 5),
        priority: 'Express',
        weightKg: 10.5,
        lengthCm: 5,
        widthCm: 5,
        heightCm: 5,
      );

      final json = request.toJson();

      // Assert business logic mapping
      expect(json['preferredPickupDate'], startsWith('2025-01-01T00:00:00.000')); 
      expect(json['preferredPickupTime'], '14:05:00'); // Validated exact span logic format
      expect(json['priority'], 'Express');
      expect(json['weightKg'], 10.5);
    });

    test('API INTEGRATION - Repository successfully handles payload execution', () async {
      final fakeDio = FakeDio();
      final repo = CustomerRepository(fakeDio);
      
      // Simulate backend response schema
      fakeDio.mockResponse = {
        'id': 'api-123',
        'customerId': 'u-1',
        'pickupAddress': 'P1',
        'pickupCity': 'P2',
        'deliveryAddress': 'D1',
        'deliveryCity': 'D2',
        'packageDescription': 'Desc',
        'preferredPickupDate': '2025-01-01T00:00:00.000Z',
        'preferredPickupTime': '10:00:00',
        'priority': 'Standard',
        'weightKg': 10,
        'lengthCm': 10,
        'widthCm': 10,
        'heightCm': 10,
        'status': 'Pending',
        'createdAt': '2025-01-01T00:00:00.000Z',
      };

      final request = CreateOrderRequest(
        pickupAddress: 'P1', pickupCity: 'P2',
        deliveryAddress: 'D1', deliveryCity: 'D2',
        packageDescription: 'Desc',
        preferredPickupDate: DateTime.now(),
        preferredPickupTime: const Duration(hours: 10),
        priority: 'Standard',
        weightKg: 10, lengthCm: 10, widthCm: 10, heightCm: 10,
      );

      final result = await repo.createOrder(request);

      // Verify correct API path selection
      expect(fakeDio.capturedPath, '/orders');
      
      // Verify payload correctly embedded 
      expect(fakeDio.capturedData['deliveryCity'], 'D2');
      
      // Verify parsed output is safely hydrated
      expect(result.id, 'api-123');
      expect(result.status, 'Pending');
    });
  });
}
