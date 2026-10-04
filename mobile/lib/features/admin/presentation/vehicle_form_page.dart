import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/login_page.dart' show friendlyError;
import '../data/admin_repository.dart';
import '../data/models/fleet.dart';

const vehicleStatusOptions = ['Available', 'In transit', 'In maintenance', 'Out of service', 'Decommissioned'];

/// Create or edit a vehicle. Status is sent as its int index. Pass [vehicle]
/// to edit, omit to create.
class VehicleFormPage extends ConsumerStatefulWidget {
  const VehicleFormPage({super.key, this.vehicle});
  final Vehicle? vehicle;

  @override
  ConsumerState<VehicleFormPage> createState() => _VehicleFormPageState();
}

class _VehicleFormPageState extends ConsumerState<VehicleFormPage> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _reg;
  late final TextEditingController _type;
  late final TextEditingController _make;
  late final TextEditingController _model;
  late final TextEditingController _capacity;
  late int _status;
  bool _saving = false;
  String? _error;

  bool get _isEdit => widget.vehicle != null;

  @override
  void initState() {
    super.initState();
    final v = widget.vehicle;
    _reg = TextEditingController(text: v?.registrationNumber ?? '');
    _type = TextEditingController(text: v?.vehicleType ?? '');
    _make = TextEditingController(text: v?.make ?? '');
    _model = TextEditingController(text: v?.model ?? '');
    _capacity = TextEditingController(text: v == null ? '' : v.capacity.toString());
    _status = v?.status ?? 0; // Available
  }

  @override
  void dispose() {
    _reg.dispose();
    _type.dispose();
    _make.dispose();
    _model.dispose();
    _capacity.dispose();
    super.dispose();
  }

  String? _req(String? v, String field) => (v == null || v.trim().isEmpty) ? '$field is required.' : null;

  Future<void> _save() async {
    setState(() => _error = null);
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    final body = {
      'registrationNumber': _reg.text.trim(),
      'vehicleType': _type.text.trim(),
      'make': _make.text.trim(),
      'model': _model.text.trim(),
      'capacity': double.parse(_capacity.text.trim()),
      'status': _status,
    };
    try {
      final repo = ref.read(adminRepositoryProvider);
      if (_isEdit) {
        await repo.updateVehicle(widget.vehicle!.id, body);
      } else {
        await repo.createVehicle(body);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Could not save the vehicle.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Edit Vehicle' : 'Add Vehicle')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _reg,
              decoration: const InputDecoration(labelText: 'Registration number'),
              validator: (v) => _req(v, 'Registration number'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _type,
              decoration: const InputDecoration(labelText: 'Vehicle type', hintText: 'Van, Truck, Bike…'),
              validator: (v) => _req(v, 'Vehicle type'),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: TextFormField(
                  controller: _make,
                  decoration: const InputDecoration(labelText: 'Make'),
                  validator: (v) => _req(v, 'Make'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextFormField(
                  controller: _model,
                  decoration: const InputDecoration(labelText: 'Model'),
                  validator: (v) => _req(v, 'Model'),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            TextFormField(
              controller: _capacity,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Capacity (kg)'),
              validator: (v) {
                final n = double.tryParse((v ?? '').trim());
                if (n == null) return 'Capacity must be a number.';
                if (n <= 0) return 'Capacity must be greater than zero.';
                return null;
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: [
                for (var i = 0; i < vehicleStatusOptions.length; i++)
                  DropdownMenuItem(value: i, child: Text(vehicleStatusOptions[i])),
              ],
              onChanged: (v) => setState(() => _status = v ?? 0),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.check),
              label: Text(_saving ? 'Saving…' : (_isEdit ? 'Save changes' : 'Add vehicle')),
            ),
          ],
        ),
      ),
    );
  }
}
