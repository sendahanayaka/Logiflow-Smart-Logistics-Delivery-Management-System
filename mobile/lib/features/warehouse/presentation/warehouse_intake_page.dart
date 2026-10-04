import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/models/warehouse_models.dart';
import '../data/tracking_code.dart';
import '../data/warehouse_repository.dart';
import 'warehouse_error.dart';

class WarehouseIntakePage extends ConsumerStatefulWidget {
  const WarehouseIntakePage({required this.warehouse, super.key});

  final Warehouse warehouse;

  @override
  ConsumerState<WarehouseIntakePage> createState() =>
      _WarehouseIntakePageState();
}

class _WarehouseIntakePageState extends ConsumerState<WarehouseIntakePage> {
  final _formKey = GlobalKey<FormState>();
  final _trackingCode = TextEditingController();
  final _weight = TextEditingController();
  final _volume = TextEditingController();
  final _specialHandling = TextEditingController();
  late Future<_IntakeOptions> _options;
  IntakeOrder? _selectedOrder;
  StorageZone? _selectedZone;
  bool _isFragile = false;
  bool _submitting = false;
  String? _submitError;
  WarehousePackage? _receipt;

  @override
  void initState() {
    super.initState();
    _options = _loadOptions();
  }

  Future<_IntakeOptions> _loadOptions() async {
    final repository = ref.read(warehouseRepositoryProvider);
    final results = await Future.wait<dynamic>([
      repository.getStorageZones(widget.warehouse.id),
      repository.getIntakeOrders(),
    ]);
    return _IntakeOptions(
        zones: results[0] as List<StorageZone>,
        orders: results[1] as List<IntakeOrder>);
  }

  @override
  void dispose() {
    _trackingCode.dispose();
    _weight.dispose();
    _volume.dispose();
    _specialHandling.dispose();
    super.dispose();
  }

  Future<void> _scanCode() async {
    final scanned =
        await context.push<String>('/warehouse/${widget.warehouse.id}/scan');
    if (scanned != null && mounted) {
      setState(() => _trackingCode.text = scanned);
    }
  }

  void _clearPackageForm() {
    _trackingCode.clear();
    _weight.clear();
    _volume.clear();
    _specialHandling.clear();
    _selectedOrder = null;
    _selectedZone = null;
    _isFragile = false;
    _submitError = null;
  }

  void _resetForNextPackage() {
    setState(() {
      _clearPackageForm();
      _receipt = null;
    });
  }

  Future<void> _submit() async {
    final errors = ReceivePackageFormValidator.validate(
      orderId: _selectedOrder?.id,
      storageZoneId: _selectedZone?.id,
      trackingCode: _trackingCode.text,
      weightKg: _weight.text,
      volumeM3: _volume.text,
    );
    _formKey.currentState?.validate();
    if (errors.isNotEmpty) {
      setState(() => _submitError = errors.values.first);
      return;
    }

    setState(() {
      _submitting = true;
      _submitError = null;
      _receipt = null;
    });
    try {
      final receipt =
          await ref.read(warehouseRepositoryProvider).receivePackage(
                ReceivePackageRequest(
                  orderId: _selectedOrder!.id,
                  warehouseId: widget.warehouse.id,
                  storageZoneId: _selectedZone!.id,
                  trackingCode: TrackingCode.normalize(_trackingCode.text),
                  weightKg: double.parse(_weight.text),
                  volumeM3: double.parse(_volume.text),
                  isFragile: _isFragile,
                  specialHandling: _specialHandling.text.trim().isEmpty
                      ? null
                      : _specialHandling.text.trim(),
                ),
              );
      if (mounted) {
        setState(() {
          _clearPackageForm();
          _receipt = receipt;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() => _submitError =
            warehouseErrorMessage(error, fallback: 'Package intake failed.'));
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${widget.warehouse.name} intake')),
      body: FutureBuilder<_IntakeOptions>(
        future: _options,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _IntakeLoadError(
                onRetry: () => setState(() => _options = _loadOptions()));
          }
          return _buildForm(context, snapshot.data!);
        },
      ),
    );
  }

  Widget _buildForm(BuildContext context, _IntakeOptions options) {
    if (_receipt != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle_outline,
                      color: Colors.green, size: 52),
                  const SizedBox(height: 12),
                  const Text('Package received',
                      style:
                          TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Tracking code: ${_receipt!.trackingCode}'),
                  Text('Status: ${_receipt!.status}'),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    onPressed: _resetForNextPackage,
                    icon: const Icon(Icons.qr_code_scanner),
                    label: const Text('Scan next package'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(widget.warehouse.location,
              style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _trackingCode,
                  decoration: const InputDecoration(labelText: 'Tracking code'),
                  textCapitalization: TextCapitalization.none,
                  validator: (value) => TrackingCode.validate(value ?? ''),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                tooltip: 'Scan QR or barcode',
                onPressed: _submitting ? null : _scanCode,
                icon: const Icon(Icons.qr_code_scanner),
              ),
            ],
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<IntakeOrder>(
            initialValue: _selectedOrder,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Order'),
            items: options.orders
                .map((order) => DropdownMenuItem(
                    value: order,
                    child: Text(order.displayLabel,
                        overflow: TextOverflow.ellipsis)))
                .toList(),
            onChanged: _submitting
                ? null
                : (value) => setState(() => _selectedOrder = value),
            validator: (value) => value == null ? 'Select an order.' : null,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<StorageZone>(
            initialValue: _selectedZone,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'Storage zone'),
            items: options.zones
                .map((zone) => DropdownMenuItem(
                    value: zone, child: Text('${zone.code} · ${zone.name}')))
                .toList(),
            onChanged: _submitting
                ? null
                : (value) => setState(() => _selectedZone = value),
            validator: (value) =>
                value == null ? 'Select a storage zone.' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _weight,
            decoration: const InputDecoration(labelText: 'Weight (kg)'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: (value) => (double.tryParse(value ?? '') ?? 0) <= 0
                ? 'Enter a weight greater than zero.'
                : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _volume,
            decoration: const InputDecoration(labelText: 'Volume (m³)'),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: (value) => (double.tryParse(value ?? '') ?? 0) <= 0
                ? 'Enter a volume greater than zero.'
                : null,
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Fragile package'),
            value: _isFragile,
            onChanged: _submitting
                ? null
                : (value) => setState(() => _isFragile = value),
          ),
          TextFormField(
            controller: _specialHandling,
            decoration:
                const InputDecoration(labelText: 'Special handling (optional)'),
            maxLength: 500,
            maxLines: 2,
          ),
          if (_submitError != null) ...[
            const SizedBox(height: 4),
            Text(_submitError!,
                style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _submitting ? null : _submit,
            child: Text(_submitting ? 'Receiving package…' : 'Receive package'),
          ),
        ],
      ),
    );
  }
}

class _IntakeOptions {
  const _IntakeOptions({required this.zones, required this.orders});
  final List<StorageZone> zones;
  final List<IntakeOrder> orders;
}

class _IntakeLoadError extends StatelessWidget {
  const _IntakeLoadError({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Unable to load orders or storage zones.',
                  textAlign: TextAlign.center),
              const SizedBox(height: 12),
              OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ),
        ),
      );
}
