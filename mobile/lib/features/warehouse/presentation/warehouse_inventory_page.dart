import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/login_page.dart' show friendlyError;
import '../data/models/warehouse_models.dart';
import '../data/warehouse_repository.dart';
import 'warehouse_error.dart';

/// Inventory browser for one warehouse: view packages, release received stock,
/// and edit received/available packages. (Item 2 — edit inventory.)
class WarehouseInventoryPage extends ConsumerStatefulWidget {
  const WarehouseInventoryPage({super.key, required this.warehouse});

  final Warehouse warehouse;

  @override
  ConsumerState<WarehouseInventoryPage> createState() => _WarehouseInventoryPageState();
}

class _WarehouseInventoryPageState extends ConsumerState<WarehouseInventoryPage> {
  late Future<_InventoryData> _data;

  @override
  void initState() {
    super.initState();
    _data = _load();
  }

  Future<_InventoryData> _load() async {
    final repo = ref.read(warehouseRepositoryProvider);
    final results = await Future.wait([
      repo.getPackages(widget.warehouse.id),
      repo.getStorageZones(widget.warehouse.id),
    ]);
    return _InventoryData(
      packages: results[0] as List<WarehousePackage>,
      zones: results[1] as List<StorageZone>,
    );
  }

  void _reload() => setState(() => _data = _load());

  Future<void> _makeAvailable(WarehousePackage pkg) async {
    try {
      await ref.read(warehouseRepositoryProvider).makePackageAvailable(pkg.id);
      _reload();
      _toast('${pkg.trackingCode} is now available.');
    } catch (e) {
      _toast(friendlyError(e, 'Could not update the package.'));
    }
  }

  Future<void> _edit(WarehousePackage pkg, List<StorageZone> zones) async {
    final updated = await showDialog<WarehousePackage>(
      context: context,
      builder: (_) => _EditPackageDialog(pkg: pkg, zones: zones),
    );
    if (updated != null) _reload();
  }

  void _toast(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('${widget.warehouse.name} · Inventory')),
      body: FutureBuilder<_InventoryData>(
        future: _data,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(warehouseErrorMessage(snapshot.error!,
                        fallback: 'Unable to load inventory.'),
                        textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    OutlinedButton(onPressed: _reload, child: const Text('Retry')),
                  ],
                ),
              ),
            );
          }
          final data = snapshot.data!;
          if (data.packages.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => _reload(),
              child: ListView(
                children: const [
                  Padding(
                    padding: EdgeInsets.all(32),
                    child: Center(child: Text('No packages in this warehouse yet.')),
                  ),
                ],
              ),
            );
          }
          final zonesById = {for (final z in data.zones) z.id: z};
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: data.packages.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final pkg = data.packages[index];
                final zone = zonesById[pkg.storageZoneId];
                final editable = pkg.status == 'Received' || pkg.status == 'Available';
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(pkg.trackingCode,
                                  style: const TextStyle(fontWeight: FontWeight.bold)),
                            ),
                            Chip(label: Text(pkg.status)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('Zone: ${zone?.code ?? pkg.storageZoneId}'),
                        Text('${pkg.weightKg} kg · ${pkg.volumeM3} m³'
                            '${pkg.isFragile ? ' · Fragile' : ''}'),
                        if (pkg.specialHandling != null && pkg.specialHandling!.isNotEmpty)
                          Text('Handling: ${pkg.specialHandling}'),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            if (pkg.status == 'Received')
                              TextButton(
                                onPressed: () => _makeAvailable(pkg),
                                child: const Text('Make available'),
                              ),
                            if (editable)
                              TextButton(
                                onPressed: () => _edit(pkg, data.zones),
                                child: const Text('Edit'),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _InventoryData {
  const _InventoryData({required this.packages, required this.zones});
  final List<WarehousePackage> packages;
  final List<StorageZone> zones;
}

class _EditPackageDialog extends ConsumerStatefulWidget {
  const _EditPackageDialog({required this.pkg, required this.zones});
  final WarehousePackage pkg;
  final List<StorageZone> zones;
  @override
  ConsumerState<_EditPackageDialog> createState() => _EditPackageDialogState();
}

class _EditPackageDialogState extends ConsumerState<_EditPackageDialog> {
  final _formKey = GlobalKey<FormState>();
  late String _zoneId = widget.pkg.storageZoneId;
  late final TextEditingController _weight =
      TextEditingController(text: widget.pkg.weightKg.toString());
  late final TextEditingController _volume =
      TextEditingController(text: widget.pkg.volumeM3.toString());
  late bool _fragile = widget.pkg.isFragile;
  late final TextEditingController _handling =
      TextEditingController(text: widget.pkg.specialHandling ?? '');
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _weight.dispose();
    _volume.dispose();
    _handling.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _saving = true; _error = null; });
    try {
      final updated = await ref.read(warehouseRepositoryProvider).updatePackage(
            widget.pkg.id,
            UpdatePackageRequest(
              storageZoneId: _zoneId,
              weightKg: double.parse(_weight.text),
              volumeM3: double.parse(_volume.text),
              isFragile: _fragile,
              specialHandling: _handling.text.trim().isEmpty ? null : _handling.text.trim(),
            ),
          );
      if (mounted) Navigator.of(context).pop(updated);
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Could not update the package.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Edit ${widget.pkg.trackingCode}'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: _zoneId,
                decoration: const InputDecoration(labelText: 'Storage zone'),
                items: widget.zones
                    .map((z) => DropdownMenuItem(value: z.id, child: Text('${z.code} · ${z.name}')))
                    .toList(),
                onChanged: (v) => setState(() => _zoneId = v ?? _zoneId),
              ),
              TextFormField(
                controller: _weight,
                decoration: const InputDecoration(labelText: 'Weight (kg)'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: _positiveNumber,
              ),
              TextFormField(
                controller: _volume,
                decoration: const InputDecoration(labelText: 'Volume (m³)'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: _positiveNumber,
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Fragile'),
                value: _fragile,
                onChanged: (v) => setState(() => _fragile = v),
              ),
              TextFormField(
                controller: _handling,
                decoration: const InputDecoration(labelText: 'Special handling (optional)'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
            ],
          ),
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
