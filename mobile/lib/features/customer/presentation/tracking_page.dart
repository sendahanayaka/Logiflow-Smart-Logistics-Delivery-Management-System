import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/theme/app_theme.dart';
import '../data/customer_repository.dart';
import '../data/models/customer_tracking.dart';

/// Live tracking for one of the customer's orders. Polls every 5s.
/// Shows ONLY this order's progress + the assigned driver's contact —
/// never batching, the route, or other customers on the same van.
class TrackingPage extends ConsumerStatefulWidget {
  const TrackingPage({super.key, required this.orderId});
  final String orderId;

  @override
  ConsumerState<TrackingPage> createState() => _TrackingPageState();
}

class _TrackingPageState extends ConsumerState<TrackingPage> {
  static const _steps = ['Preparing', 'Awaiting dispatch', 'On the way', 'Delivered'];

  CustomerTracking? _t;
  bool _loading = true;
  String? _error;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _fetch();
    _poll = Timer.periodic(const Duration(seconds: 5), (_) => _fetch());
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  Future<void> _fetch() async {
    try {
      final t = await ref.read(customerRepositoryProvider).orderTracking(widget.orderId);
      if (!mounted) return;
      setState(() {
        _t = t;
        _loading = false;
        _error = null;
      });
      if (t.isDelivered) _poll?.cancel(); // nothing more to poll for
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        if (_t == null) _error = "Couldn't load tracking.";
      });
    }
  }

  int _currentStep(CustomerTracking t) {
    if (t.isDelivered) return 3;
    final stage = t.stage.toUpperCase();
    final ship = (t.shipmentStatus ?? '').toUpperCase();
    if (stage == 'DISPATCHED' || ship == 'DISPATCHED' || ship == 'INTRANSIT') return 2;
    if (stage == 'AWAITINGDISPATCH') return 1;
    return 0;
  }

  Future<void> _callDriver(String contact) async {
    final uri = Uri(scheme: 'tel', path: contact);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Call $contact')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Track Delivery')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _t == null
              ? Center(child: Text(_error ?? 'No tracking available.'))
              : RefreshIndicator(
                  onRefresh: _fetch,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: _body(_t!),
                  ),
                ),
    );
  }

  List<Widget> _body(CustomerTracking t) {
    final step = _currentStep(t);
    return [
      if (t.shipmentCode != null)
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text('Shipment ${t.shipmentCode}',
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.navy)),
        ),
      _stepper(step, t.isDelivered),
      const SizedBox(height: 16),
      if (t.isDelivered)
        _deliveredCard(t)
      else if (t.hasShipment)
        _driverCard(t)
      else
        _preparingCard(),
    ];
  }

  Widget _stepper(int current, bool delivered) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: List.generate(_steps.length, (i) {
            final done = i < current || (delivered && i <= current);
            final active = i == current && !delivered;
            final last = i == _steps.length - 1;
            return IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      CircleAvatar(
                        radius: 14,
                        backgroundColor: done
                            ? Colors.green
                            : active
                                ? AppTheme.orange
                                : Colors.black12,
                        child: Icon(
                          done ? Icons.check : Icons.circle,
                          size: done ? 16 : 10,
                          color: done || active ? Colors.white : Colors.black38,
                        ),
                      ),
                      if (!last)
                        Expanded(
                          child: Container(
                            width: 2,
                            color: i < current ? Colors.green : Colors.black12,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Padding(
                    padding: EdgeInsets.only(top: 4, bottom: last ? 0 : 20),
                    child: Text(
                      _steps[i],
                      style: TextStyle(
                        fontWeight: active || done ? FontWeight.w600 : FontWeight.normal,
                        color: active || done ? Colors.black : Colors.black45,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ),
      ),
    );
  }

  Widget _driverCard(CustomerTracking t) {
    final eta = t.eta;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('YOUR DRIVER',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 0.5)),
          const SizedBox(height: 12),
          Row(children: [
            const CircleAvatar(backgroundColor: AppTheme.navy, child: Icon(Icons.person, color: Colors.white)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t.driverName ?? 'Assigned driver', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                if (t.vehicleRegistration != null)
                  Text(t.vehicleRegistration!, style: const TextStyle(color: Colors.black54)),
              ]),
            ),
            if (t.driverContact != null)
              IconButton.filled(
                onPressed: () => _callDriver(t.driverContact!),
                icon: const Icon(Icons.call),
                tooltip: 'Call driver',
              ),
          ]),
          const Divider(height: 24),
          if (eta != null)
            Row(children: [
              const Icon(Icons.schedule, size: 18, color: Colors.black54),
              const SizedBox(width: 8),
              Text('ETA ${DateFormat('d MMM, h:mm a').format(eta)}'),
              const Spacer(),
              if (t.onTime != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: t.onTime! ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(t.onTime! ? 'On time' : 'Delayed',
                      style: TextStyle(
                          color: t.onTime! ? const Color(0xFF166534) : const Color(0xFF991B1B),
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                ),
            ]),
          if (t.arrivedAt != null) ...[
            const SizedBox(height: 8),
            Row(children: [
              const Icon(Icons.location_on, size: 18, color: Colors.black54),
              const SizedBox(width: 8),
              Text('Driver arrived ${DateFormat('h:mm a').format(t.arrivedAt!)}'),
            ]),
          ],
        ]),
      ),
    );
  }

  Widget _deliveredCard(CustomerTracking t) => Card(
        color: const Color(0xFFECFDF5),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.check_circle, color: Colors.green),
              SizedBox(width: 8),
              Text('Delivered', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF065F46))),
            ]),
            const SizedBox(height: 8),
            if (t.deliveredAt != null)
              Text('On ${DateFormat('d MMM yyyy, h:mm a').format(t.deliveredAt!)}',
                  style: const TextStyle(color: Color(0xFF047857))),
            if (t.receivedByName != null)
              Text('Received by ${t.receivedByName}', style: const TextStyle(color: Color(0xFF047857))),
          ]),
        ),
      );

  Widget _preparingCard() => const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(children: [
            Icon(Icons.inventory_2_outlined, color: Colors.black54),
            SizedBox(width: 12),
            Expanded(
              child: Text("Your order is being prepared. You'll see driver details here once it's dispatched.",
                  style: TextStyle(color: Colors.black54)),
            ),
          ]),
        ),
      );
}
