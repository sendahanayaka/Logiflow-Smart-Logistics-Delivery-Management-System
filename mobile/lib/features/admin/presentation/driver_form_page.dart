import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../auth/presentation/login_page.dart' show friendlyError;
import '../data/admin_repository.dart';
import '../data/models/fleet.dart';

const driverStatusOptions = ['Off duty', 'Available', 'On duty', 'On delivery', 'Suspended', 'Inactive'];

/// Create or edit a driver. Status is sent as its int index (the API uses
/// numeric enums). Pass [driver] to edit, omit to create.
class DriverFormPage extends ConsumerStatefulWidget {
  const DriverFormPage({super.key, this.driver});
  final Driver? driver;

  @override
  ConsumerState<DriverFormPage> createState() => _DriverFormPageState();
}

class _DriverFormPageState extends ConsumerState<DriverFormPage> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _license;
  late final TextEditingController _phone;
  late DateTime _expiry;
  late int _status;
  bool _saving = false;
  String? _error;

  bool get _isEdit => widget.driver != null;

  @override
  void initState() {
    super.initState();
    final d = widget.driver;
    _name = TextEditingController(text: d?.fullName ?? '');
    _license = TextEditingController(text: d?.licenseNumber ?? '');
    _phone = TextEditingController(text: d?.phoneNumber ?? '');
    _expiry = d?.licenseExpiryDate ?? DateTime.now().add(const Duration(days: 365));
    _status = d?.status ?? 1; // Available
  }

  @override
  void dispose() {
    _name.dispose();
    _license.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _pickExpiry() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _expiry,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 20),
    );
    if (picked != null) setState(() => _expiry = picked);
  }

  Future<void> _save() async {
    setState(() => _error = null);
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    final body = {
      'fullName': _name.text.trim(),
      'licenseNumber': _license.text.trim(),
      'licenseExpiryDate': DateTime(_expiry.year, _expiry.month, _expiry.day).toIso8601String(),
      'phoneNumber': _phone.text.trim().isEmpty ? null : _phone.text.trim(),
      'status': _status,
      if (_isEdit && widget.driver!.userId != null) 'userId': widget.driver!.userId,
    };
    try {
      final repo = ref.read(adminRepositoryProvider);
      if (_isEdit) {
        await repo.updateDriver(widget.driver!.id, body);
      } else {
        await repo.createDriver(body);
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = friendlyError(e, 'Could not save the driver.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? 'Edit Driver' : 'Add Driver')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Full name'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Full name is required.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _license,
              decoration: const InputDecoration(labelText: 'License number'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'License number is required.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone (optional)'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _pickExpiry,
              icon: const Icon(Icons.event),
              label: Text('License expiry: ${DateFormat('d MMM yyyy').format(_expiry)}'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<int>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: [
                for (var i = 0; i < driverStatusOptions.length; i++)
                  DropdownMenuItem(value: i, child: Text(driverStatusOptions[i])),
              ],
              onChanged: (v) => setState(() => _status = v ?? 1),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _saving ? null : _save,
              icon: const Icon(Icons.check),
              label: Text(_saving ? 'Saving…' : (_isEdit ? 'Save changes' : 'Add driver')),
            ),
          ],
        ),
      ),
    );
  }
}
