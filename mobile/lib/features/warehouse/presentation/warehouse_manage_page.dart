import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../auth/presentation/login_page.dart' show friendlyError;
import '../data/models/warehouse_models.dart';
import '../data/warehouse_repository.dart';
import 'warehouse_error.dart';

/// Management hub for one warehouse: edit the warehouse, edit its storage
/// zones, and jump to intake or inventory. (Item 2 — warehouse CRUD.)
class WarehouseManagePage extends ConsumerStatefulWidget {
  const WarehouseManagePage({super.key, required this.warehouse});

  final Warehouse warehouse;

  @override
  ConsumerState<WarehouseManagePage> createState() => _WarehouseManagePageState();
}

class _WarehouseManagePageState extends ConsumerState<WarehouseManagePage> {
  late Warehouse _warehouse;
  late Future<List<StorageZone>> _zones;

  @override
  void initState() {
    super.initState();
    _warehouse = widget.warehouse;
    _zones = _loadZones();
  }

  Future<List<StorageZone>> _loadZones() =>
      ref.read(warehouseRepositoryProvider).getStorageZones(_warehouse.id);

  void _reloadZones() => setState(() => _zones = _loadZones());

  Future<void> _editWarehouse() async {
    final updated = await showDialog<Warehouse>(
      context: context,
      builder: (_) => _EditWarehouseDialog(warehouse: _warehouse),
    );
    if (updated != null && mounted) setState(() => _warehouse = updated);
  }

  Future<void> _editZone(StorageZone zone) async {
    final updated = await showDialog<StorageZone>(
      context: context,
      builder: (_) => _EditZoneDialog(zone: zone),
    );
    if (updated != null) _reloadZones();
  }

  @override
  Widget build(BuildContext context) {
    final occupied = _warehouse.occupiedVolumeM3;
    final total = _warehouse.totalVolumeM3;
    return Scaffold(
      appBar: AppBar(title: Text(_warehouse.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_warehouse.location,
                      style: Theme.of(context).textTheme.bodyMedium),
                  const SizedBox(height: 8),
                  Text('${occupied.toStringAsFixed(2)} / ${total.toStringAsFixed(2)} m³ occupied'),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: OutlinedButton.icon(
                      onPressed: _editWarehouse,
                      icon: const Icon(Icons.edit_outlined),
                      label: const Text('Edit warehouse'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => context.push('/warehouse/${_warehouse.id}/intake',
                      extra: _warehouse),
                  icon: const Icon(Icons.inbox_outlined),
                  label: const Text('Intake'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.tonalIcon(
                  onPressed: () => context.push('/warehouse/${_warehouse.id}/inventory',
                      extra: _warehouse),
                  icon: const Icon(Icons.inventory_2_outlined),
                  label: const Text('Inventory'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text('Storage zones', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          FutureBuilder<List<StorageZone>>(
            future: _zones,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              if (snapshot.hasError) {
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(warehouseErrorMessage(snapshot.error!,
                      fallback: 'Unable to load storage zones.')),
                );
              }
              final zones = snapshot.data ?? const <StorageZone>[];
              if (zones.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No storage zones are configured for this warehouse.'),
                );
              }
              return Column(
                children: zones
                    .map((zone) => Card(
                          child: ListTile(
                            title: Text('${zone.code} · ${zone.name}'),
                            subtitle: Text(
                                '${zone.occupiedVolumeM3.toStringAsFixed(2)} / ${zone.totalVolumeM3.toStringAsFixed(2)} m³'),
                            trailing: IconButton(
                              icon: const Icon(Icons.edit_outlined),
                              onPressed: () => _editZone(zone),
                            ),
                          ),
                        ))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _EditWarehouseDialog extends ConsumerStatefulWidget {
  const _EditWarehouseDialog({required this.warehouse});
  final Warehouse warehouse;
  @override
  ConsumerState<_EditWarehouseDialog> createState() => _EditWarehouseDialogState();
}

class _EditWarehouseDialogState extends ConsumerState<_EditWarehouseDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name =
      TextEditingController(text: widget.warehouse.name);
  late final TextEditingController _location =
      TextEditingController(text: widget.warehouse.location);
  late final TextEditingController _total = TextEditingController(
      text: widget.warehouse.totalVolumeM3.toString());
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _location.dispose();
    _total.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      final updated = await ref.read(warehouseRepositoryProvider).updateWarehouse(
            widget.warehouse.id,
            UpdateWarehouseRequest(
              name: _name.text.trim(),
              location: _location.text.trim(),
              totalVolumeM3: double.parse(_total.text),
            ),
          );
      if (mounted) Navigator.of(context).pop(updated);
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Could not update the warehouse.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit warehouse'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required.' : null,
            ),
            TextFormField(
              controller: _location,
              decoration: const InputDecoration(labelText: 'Location'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Location is required.' : null,
            ),
            TextFormField(
              controller: _total,
              decoration: const InputDecoration(labelText: 'Total capacity (m³)'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: _positiveNumber,
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _saving ? null : () => Navigator.of(context).pop(), child: const Text('Cancel')),
        FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving…' : 'Save')),
      ],
    );
  }
}

class _EditZoneDialog extends ConsumerStatefulWidget {
  const _EditZoneDialog({required this.zone});
  final StorageZone zone;
  @override
  ConsumerState<_EditZoneDialog> createState() => _EditZoneDialogState();
}

class _EditZoneDialogState extends ConsumerState<_EditZoneDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name = TextEditingController(text: widget.zone.name);
  late final TextEditingController _code = TextEditingController(text: widget.zone.code);
  late final TextEditingController _total =
      TextEditingController(text: widget.zone.totalVolumeM3.toString());
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _code.dispose();
    _total.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      final updated = await ref.read(warehouseRepositoryProvider).updateStorageZone(
            widget.zone.warehouseId,
            widget.zone.id,
            UpdateStorageZoneRequest(
              name: _name.text.trim(),
              code: _code.text.trim(),
              totalVolumeM3: double.parse(_total.text),
            ),
          );
      if (mounted) Navigator.of(context).pop(updated);
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Could not update the zone.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Edit zone ${widget.zone.code}'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required.' : null,
            ),
            TextFormField(
              controller: _code,
              decoration: const InputDecoration(labelText: 'Code'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Code is required.' : null,
            ),
            TextFormField(
              controller: _total,
              decoration: const InputDecoration(labelText: 'Total capacity (m³)'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              validator: _positiveNumber,
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: _saving ? null : () => Navigator.of(context).pop(), child: const Text('Cancel')),
        FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? 'Saving…' : 'Save')),
      ],
    );
  }
}

String? _positiveNumber(String? value) {
  final parsed = double.tryParse((value ?? '').trim());
  if (parsed == null || parsed <= 0) return 'Enter a number greater than zero.';
  return null;
}
