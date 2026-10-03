import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/presentation/login_page.dart' show friendlyError;
import '../data/customer_repository.dart';
import '../data/models/order.dart';
import 'controllers/orders_controller.dart';

const _methods = <_PayMethod>[
  _PayMethod('Cash on Pickup', Icons.payments_outlined, 'Pay in cash when your package is collected.'),
  _PayMethod('Card Payment', Icons.credit_card, 'Pay using your debit or credit card.'),
  _PayMethod('Online Bank Transfer', Icons.account_balance, 'Transfer the amount and keep your receipt.'),
];

/// Review the delivery fee (polled briefly until the backend computes it) and
/// confirm payment — PATCH /orders/{id}/checkout. Payment capture is mock
/// (nothing but the chosen method is sent; the backend only records it).
class CheckoutPage extends ConsumerStatefulWidget {
  const CheckoutPage({super.key, required this.orderId});
  final String orderId;

  @override
  ConsumerState<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends ConsumerState<CheckoutPage> {
  Order? _order;
  bool _loading = true;
  String? _loadError;
  int _retries = 0;
  Timer? _poll;

  String _method = '';
  final _cardName = TextEditingController();
  final _cardNumber = TextEditingController();
  final _cardExpiry = TextEditingController();
  final _cardCvv = TextEditingController();
  bool _bankAck = false;

  bool _confirming = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetch();
    // Poll a few times for async pricing, like the web checkout.
    _poll = Timer.periodic(const Duration(seconds: 2), (t) {
      if (_retries >= 3 || (_order?.pricing != null)) {
        t.cancel();
        return;
      }
      _retries++;
      _fetch();
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    _cardName.dispose();
    _cardNumber.dispose();
    _cardExpiry.dispose();
    _cardCvv.dispose();
    super.dispose();
  }

  Future<void> _fetch() async {
    try {
      final o = await ref.read(customerRepositoryProvider).orderById(widget.orderId);
      if (!mounted) return;
      setState(() {
        _order = o;
        _loading = false;
      });
      if (o.pricing != null) _poll?.cancel();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadError = friendlyError(e, 'Failed to load the order.');
      });
    }
  }

  bool get _paymentValid {
    switch (_method) {
      case 'Card Payment':
        return _cardName.text.trim().length >= 2 &&
            _cardNumber.text.replaceAll(' ', '').length >= 16 &&
            _cardExpiry.text.length >= 5 &&
            _cardCvv.text.length >= 3;
      case 'Online Bank Transfer':
        return _bankAck;
      case 'Cash on Pickup':
        return true;
      default:
        return false;
    }
  }

  Future<void> _confirm() async {
    if (!_paymentValid) return;
    setState(() {
      _confirming = true;
      _error = null;
    });
    try {
      await ref.read(customerRepositoryProvider).checkout(widget.orderId, _method);
      ref.invalidate(orderByIdProvider(widget.orderId));
      await ref.read(ordersControllerProvider.notifier).refresh();
      if (!mounted) return;
      context.pushReplacement('/customer/order/${widget.orderId}/success');
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Checkout failed. Please try again.'));
    } finally {
      if (mounted) setState(() => _confirming = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _order == null
              ? Center(child: Text(_loadError ?? 'Order not found.'))
              : _order!.isConfirmed
                  ? _alreadyConfirmed()
                  : _content(_order!),
    );
  }

  Widget _alreadyConfirmed() => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 56),
            const SizedBox(height: 12),
            const Text('This order is already confirmed.'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.pushReplacement('/customer/order/${widget.orderId}'),
              child: const Text('View order'),
            ),
          ]),
        ),
      );

  Widget _content(Order order) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _summaryCard(order),
        const SizedBox(height: 12),
        _pricingCard(order),
        const SizedBox(height: 16),
        const Text('PAYMENT METHOD',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 0.5)),
        const SizedBox(height: 8),
        ..._methods.map(_methodTile),
        const SizedBox(height: 8),
        _methodForm(),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: Colors.red)),
        ],
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: (_confirming || !_paymentValid) ? null : _confirm,
          icon: const Icon(Icons.lock),
          label: Text(_confirming ? 'Confirming…' : 'Confirm Order & Pay'),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _summaryCard(Order order) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(order.packageDescription.isEmpty ? 'Delivery order' : order.packageDescription,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 6),
            Text('${order.pickupCity} → ${order.deliveryCity}', style: const TextStyle(color: Colors.black87)),
            Text('${order.weightKg} kg · ${order.priority}', style: const TextStyle(color: Colors.black54, fontSize: 13)),
          ]),
        ),
      );

  Widget _pricingCard(Order order) {
    final p = order.pricing;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('DELIVERY FEE',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 0.5)),
          const SizedBox(height: 12),
          if (p == null && _retries < 3)
            Row(children: const [
              SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
              SizedBox(width: 10),
              Text('Calculating delivery fee…', style: TextStyle(fontStyle: FontStyle.italic, color: Colors.black54)),
            ])
          else if (p == null)
            const Text('Fee will be settled before dispatch / on delivery.', style: TextStyle(color: Colors.black54))
          else ...[
            _line('Base fee', p.baseFee),
            _line('Distance', p.distanceCharge),
            _line('Weight', p.weightCharge),
            _line('Volume', p.volumeCharge),
            _line('Priority', p.priorityCharge),
            _line('Handling', p.handlingCharge),
            const Divider(),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Total', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('Rs. ${p.totalDeliveryFee.toStringAsFixed(2)}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppTheme.navy)),
            ]),
          ],
        ]),
      ),
    );
  }

  Widget _line(String l, double v) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(l, style: const TextStyle(color: Colors.black54)),
          Text('Rs. ${v.toStringAsFixed(2)}'),
        ]),
      );

  Widget _methodTile(_PayMethod m) {
    final selected = _method == m.id;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        side: BorderSide(color: selected ? AppTheme.navy : Colors.black12, width: selected ? 2 : 1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: RadioListTile<String>(
        value: m.id,
        groupValue: _method,
        onChanged: _confirming ? null : (v) => setState(() => _method = v ?? ''),
        title: Row(children: [Icon(m.icon, size: 20), const SizedBox(width: 8), Text(m.id)]),
        subtitle: Text(m.desc),
        activeColor: AppTheme.navy,
      ),
    );
  }

  Widget _methodForm() {
    switch (_method) {
      case 'Card Payment':
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(children: [
              TextField(
                controller: _cardName,
                decoration: const InputDecoration(labelText: 'Cardholder name'),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _cardNumber,
                keyboardType: TextInputType.number,
                inputFormatters: [_CardNumberFormatter()],
                decoration: const InputDecoration(labelText: 'Card number', hintText: '1234 5678 9012 3456'),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: TextField(
                    controller: _cardExpiry,
                    keyboardType: TextInputType.number,
                    inputFormatters: [_ExpiryFormatter()],
                    decoration: const InputDecoration(labelText: 'Expiry (MM/YY)', hintText: '12/27'),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _cardCvv,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    decoration: const InputDecoration(labelText: 'CVV', counterText: ''),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ]),
            ]),
          ),
        );
      case 'Online Bank Transfer':
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Bank account details', style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              const Text('Bank: [Company Bank]\nAccount: [LogiFlow Account]\nNumber: [Account Number]\nBranch: [Branch]',
                  style: TextStyle(color: Colors.black54, height: 1.5)),
              const SizedBox(height: 8),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _bankAck,
                onChanged: _confirming ? null : (v) => setState(() => _bankAck = v ?? false),
                title: const Text('I have completed the transfer and kept my receipt.'),
                controlAffinity: ListTileControlAffinity.leading,
              ),
            ]),
          ),
        );
      case 'Cash on Pickup':
        return const Padding(
          padding: EdgeInsets.all(8),
          child: Text('No further details required — pay in cash at pickup.', style: TextStyle(color: Colors.black54)),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class _PayMethod {
  const _PayMethod(this.id, this.icon, this.desc);
  final String id;
  final IconData icon;
  final String desc;
}

/// Groups card digits as "#### #### #### ####" (max 16 digits).
class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final capped = digits.length > 16 ? digits.substring(0, 16) : digits;
    final buf = StringBuffer();
    for (var i = 0; i < capped.length; i++) {
      if (i != 0 && i % 4 == 0) buf.write(' ');
      buf.write(capped[i]);
    }
    final text = buf.toString();
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }
}

/// Formats expiry as "MM/YY".
class _ExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final capped = digits.length > 4 ? digits.substring(0, 4) : digits;
    final text = capped.length >= 3 ? '${capped.substring(0, 2)}/${capped.substring(2)}' : capped;
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }
}
