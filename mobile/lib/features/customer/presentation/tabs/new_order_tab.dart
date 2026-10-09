import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../features/auth/presentation/login_page.dart' show friendlyError;
import '../../data/customer_repository.dart';
import '../../data/models/create_order_request.dart';
import '../controllers/orders_controller.dart';

/// Create a delivery order — POST /orders. Validation mirrors the backend
/// (required address/city/description, pickup date ≥ today, weight & dims > 0,
/// priority Standard|Express, recipient name required + 10-digit recipient contact).
class NewOrderTab extends ConsumerStatefulWidget {
  const NewOrderTab({super.key});

  @override
  ConsumerState<NewOrderTab> createState() => _NewOrderTabState();
}

class _NewOrderTabState extends ConsumerState<NewOrderTab> {
  final _form = GlobalKey<FormState>();

  final _pickupAddress = TextEditingController();
  final _pickupCity = TextEditingController();
  final _deliveryAddress = TextEditingController();
  final _deliveryCity = TextEditingController();
  final _description = TextEditingController();
  final _specialHandling = TextEditingController();
  final _weight = TextEditingController();
  final _length = TextEditingController();
  final _width = TextEditingController();
  final _height = TextEditingController();
  final _recipientName = TextEditingController();
  final _recipientContact = TextEditingController();

  DateTime _pickupDate = DateTime.now();
  TimeOfDay _pickupTime = const TimeOfDay(hour: 9, minute: 0);
  String _priority = 'Standard';
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [
      _pickupAddress, _pickupCity, _deliveryAddress, _deliveryCity, _description,
      _specialHandling, _weight, _length, _width, _height, _recipientName, _recipientContact,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  String? _required(String? v, String field) =>
      (v == null || v.trim().isEmpty) ? '$field is required.' : null;

  String? _positive(String? v, String field) {
    if (v == null || v.trim().isEmpty) return '$field is required.';
    final n = double.tryParse(v.trim());
    if (n == null) return '$field must be a number.';
    if (n <= 0) return '$field must be greater than zero.';
    return null;
  }

  // Recipient contact must be exactly 10 digits (matches the backend validator).
  String? _phone(String? v, String field) {
    final t = v?.trim() ?? '';
    if (t.isEmpty) return '$field is required.';
    if (!RegExp(r'^\d{10}$').hasMatch(t)) return '$field must be a 10-digit phone number.';
    return null;
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _pickupDate.isBefore(DateTime(now.year, now.month, now.day)) ? now : _pickupDate,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 90)),
    );
    if (picked != null) setState(() => _pickupDate = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(context: context, initialTime: _pickupTime);
    if (picked != null) setState(() => _pickupTime = picked);
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (!_form.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      final request = CreateOrderRequest(
        pickupAddress: _pickupAddress.text.trim(),
        pickupCity: _pickupCity.text.trim(),
        deliveryAddress: _deliveryAddress.text.trim(),
        deliveryCity: _deliveryCity.text.trim(),
        packageDescription: _description.text.trim(),
        specialHandling: _specialHandling.text.trim().isEmpty ? null : _specialHandling.text.trim(),
        preferredPickupDate: _pickupDate,
        preferredPickupTime: Duration(hours: _pickupTime.hour, minutes: _pickupTime.minute),
        priority: _priority,
        weightKg: double.parse(_weight.text.trim()),
        lengthCm: double.parse(_length.text.trim()),
        widthCm: double.parse(_width.text.trim()),
        heightCm: double.parse(_height.text.trim()),
        recipientName: _recipientName.text.trim(),
        recipientContact: _recipientContact.text.trim(),
      );

      final order = await ref.read(customerRepositoryProvider).createOrder(request);
      await ref.read(ordersControllerProvider.notifier).refresh();

      if (!mounted) return;
      _resetForm();
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Order created. Review the fee and check out.')));
      context.push('/customer/order/${order.id}/checkout');
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Could not create the order. Please try again.'));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _resetForm() {
    _form.currentState?.reset();
    for (final c in [
      _pickupAddress, _pickupCity, _deliveryAddress, _deliveryCity, _description,
      _specialHandling, _weight, _length, _width, _height, _recipientName, _recipientContact,
    ]) {
      c.clear();
    }
    setState(() {
      _pickupDate = DateTime.now();
      _pickupTime = const TimeOfDay(hour: 9, minute: 0);
      _priority = 'Standard';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _form,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _section('Pickup', [
            _field(_pickupAddress, 'Pickup address', maxLength: 500, validator: (v) => _required(v, 'Pickup address')),
            _field(_pickupCity, 'Pickup city', maxLength: 100, validator: (v) => _required(v, 'Pickup city')),
          ]),
          _section('Delivery', [
            _field(_deliveryAddress, 'Delivery address', maxLength: 500, validator: (v) => _required(v, 'Delivery address')),
            _field(_deliveryCity, 'Delivery city', maxLength: 100, validator: (v) => _required(v, 'Delivery city')),
          ]),
          _section('Package', [
            _field(_description, 'Description', maxLength: 500, maxLines: 2, validator: (v) => _required(v, 'Description')),
            Row(children: [
              Expanded(child: _field(_weight, 'Weight (kg)', number: true, validator: (v) => _positive(v, 'Weight'))),
            ]),
            Row(children: [
              Expanded(child: _field(_length, 'Length (cm)', number: true, validator: (v) => _positive(v, 'Length'))),
              const SizedBox(width: 10),
              Expanded(child: _field(_width, 'Width (cm)', number: true, validator: (v) => _positive(v, 'Width'))),
              const SizedBox(width: 10),
              Expanded(child: _field(_height, 'Height (cm)', number: true, validator: (v) => _positive(v, 'Height'))),
            ]),
            _field(_specialHandling, 'Special handling (optional)', maxLength: 500),
            const SizedBox(height: 4),
            DropdownButtonFormField<String>(
              initialValue: _priority,
              decoration: const InputDecoration(labelText: 'Priority'),
              items: const [
                DropdownMenuItem(value: 'Standard', child: Text('Standard')),
                DropdownMenuItem(value: 'Express', child: Text('Express')),
              ],
              onChanged: (v) => setState(() => _priority = v ?? 'Standard'),
            ),
          ]),
          _section('Pickup window', [
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickDate,
                  icon: const Icon(Icons.event),
                  label: Text(DateFormat('d MMM yyyy').format(_pickupDate)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickTime,
                  icon: const Icon(Icons.schedule),
                  label: Text(_pickupTime.format(context)),
                ),
              ),
            ]),
          ]),
          _section('Recipient', [
            _field(_recipientName, 'Recipient name', maxLength: 255, validator: (v) => _required(v, 'Recipient name')),
            _field(_recipientContact, 'Recipient contact (10-digit phone)', maxLength: 10, number: true, validator: (v) => _phone(v, 'Recipient contact')),
          ]),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            ),
          FilledButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: const Icon(Icons.check),
            label: Text(_submitting ? 'Creating…' : 'Create order'),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _section(String title, List<Widget> children) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title.toUpperCase(),
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54, letterSpacing: 0.5)),
              const SizedBox(height: 8),
              ...children,
            ],
          ),
        ),
      );

  Widget _field(
    TextEditingController controller,
    String label, {
    int? maxLength,
    int maxLines = 1,
    bool number = false,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: TextFormField(
        controller: controller,
        maxLength: maxLength,
        maxLines: maxLines,
        keyboardType: number ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
        decoration: InputDecoration(labelText: label, counterText: ''),
        validator: validator,
      ),
    );
  }
}
