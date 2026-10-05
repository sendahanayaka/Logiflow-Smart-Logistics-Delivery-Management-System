import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_state.dart';
import '../../data/admin_repository.dart';
import '../../data/models/fleet.dart';
import '../controllers/admin_providers.dart';

final _activeAssignmentsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.read(adminRepositoryProvider).assignments(activeOnly: true),
);
final _assignmentHistoryProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.read(adminRepositoryProvider).assignments(),
);
final _dutySchedulesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.read(adminRepositoryProvider).dutySchedules(),
);
final _maintenanceRecordsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.read(adminRepositoryProvider).maintenanceRecords(),
);

String _dateLabel(Object? value) {
  final date = DateTime.tryParse(value?.toString() ?? '');
  return date == null ? '—' : DateFormat('d MMM yyyy · h:mm a').format(date.toLocal());
}

class FleetAssignmentsTab extends ConsumerStatefulWidget {
  const FleetAssignmentsTab({super.key});
  @override
  ConsumerState<FleetAssignmentsTab> createState() => _FleetAssignmentsTabState();
}

class _FleetAssignmentsTabState extends ConsumerState<FleetAssignmentsTab> {
  bool _showActive = true;
  bool _busy = false;

  Future<void> _assign() async {
    final drivers = ref.read(driversProvider).valueOrNull ?? const <Driver>[];
    final vehicles = ref.read(vehiclesProvider).valueOrNull ?? const <Vehicle>[];
    final availableDrivers = drivers.where((d) => d.status == 1).toList();
    final availableVehicles = vehicles.where((v) => v.status == 0).toList();
    if (availableDrivers.isEmpty || availableVehicles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('An available driver and vehicle are required.')));
      return;
    }
    final selection = await showDialog<(String, String, String)?>(
      context: context,
      builder: (_) => _AssignmentDialog(drivers: availableDrivers, vehicles: availableVehicles),
    );
    if (selection == null) return;
    setState(() => _busy = true);
    try {
      await ref.read(adminRepositoryProvider).assignDriver(
        driverId: selection.$1,
        vehicleId: selection.$2,
        notes: selection.$3,
      );
      ref.invalidate(_activeAssignmentsProvider);
      ref.invalidate(_assignmentHistoryProvider);
      ref.invalidate(driversProvider);
      ref.invalidate(vehiclesProvider);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Driver and vehicle assigned.')));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Assignment failed. Check availability and try again.')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _end(Map<String, dynamic> row) async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('End assignment?'),
        content: Text('End the assignment for ${row['driverName'] ?? 'this driver'}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('End assignment')),
        ],
      ),
    );
    if (yes != true) return;
    try {
      await ref.read(adminRepositoryProvider).endAssignment('${row['id']}');
      ref.invalidate(_activeAssignmentsProvider);
      ref.invalidate(_assignmentHistoryProvider);
      ref.invalidate(driversProvider);
      ref.invalidate(vehiclesProvider);
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not end this assignment.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = _showActive ? _activeAssignmentsProvider : _assignmentHistoryProvider;
    final async = ref.watch(provider);
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        child: Row(children: [
          Expanded(child: SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: true, label: Text('Active'), icon: Icon(Icons.link)),
              ButtonSegment(value: false, label: Text('History'), icon: Icon(Icons.history)),
            ],
            selected: {_showActive},
            onSelectionChanged: (selection) => setState(() => _showActive = selection.first),
          )),
          const SizedBox(width: 8),
          IconButton.filledTonal(onPressed: _busy ? null : _assign, tooltip: 'Assign driver and vehicle', icon: const Icon(Icons.add_link)),
        ]),
      ),
      Expanded(child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(_activeAssignmentsProvider);
          ref.invalidate(_assignmentHistoryProvider);
        },
        child: async.when(
          loading: () => const LoadingState(label: 'Loading assignments…'),
          error: (_, __) => EmptyState(icon: Icons.cloud_off_outlined, title: 'Assignments unavailable', message: 'Refresh to try again.', actionLabel: 'Retry', onAction: () => ref.invalidate(provider)),
          data: (rows) => rows.isEmpty
              ? EmptyState(icon: Icons.link_off, title: _showActive ? 'No active assignments' : 'No assignment history', message: _showActive ? 'Pair an available driver with a vehicle to dispatch.' : 'Completed assignments will appear here.')
              : ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: rows.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final row = rows[index];
                    final active = row['isActive'] == true;
                    return Card(child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          const Icon(Icons.person_pin_circle_outlined, color: AppTheme.navy),
                          const SizedBox(width: 8),
                          Expanded(child: Text('${row['driverName'] ?? 'Driver'}', style: Theme.of(context).textTheme.titleMedium)),
                          _Pill(active ? 'Active' : 'Ended', active: active),
                        ]),
                        const SizedBox(height: 10),
                        Text('Vehicle  ·  ${row['vehicleRegistrationNumber'] ?? '—'}'),
                        Text('Assigned  ·  ${_dateLabel(row['assignedAt'])}', style: Theme.of(context).textTheme.bodySmall),
                        if (row['notes'] != null && '${row['notes']}'.isNotEmpty) ...[
                          const SizedBox(height: 4), Text('${row['notes']}', style: Theme.of(context).textTheme.bodySmall),
                        ],
                        if (_showActive && active) ...[
                          const SizedBox(height: 12),
                          Align(alignment: Alignment.centerRight, child: OutlinedButton.icon(onPressed: () => _end(row), icon: const Icon(Icons.stop_circle_outlined), label: const Text('End assignment'))),
                        ],
                      ]),
                    ));
                  },
                ),
        ),
      )),
    ]);
  }
}

class _AssignmentDialog extends StatefulWidget {
  const _AssignmentDialog({required this.drivers, required this.vehicles});
  final List<Driver> drivers;
  final List<Vehicle> vehicles;
  @override
  State<_AssignmentDialog> createState() => _AssignmentDialogState();
}

class _AssignmentDialogState extends State<_AssignmentDialog> {
  String? _driverId;
  String? _vehicleId;
  final _notes = TextEditingController();
  @override
  void dispose() { _notes.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Assign resources'),
    content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
      DropdownButtonFormField<String>(decoration: const InputDecoration(labelText: 'Available driver'), initialValue: _driverId,
        items: [for (final d in widget.drivers) DropdownMenuItem(value: d.id, child: Text(d.fullName))], onChanged: (v) => setState(() => _driverId = v)),
      const SizedBox(height: 12),
      DropdownButtonFormField<String>(decoration: const InputDecoration(labelText: 'Available vehicle'), initialValue: _vehicleId,
        items: [for (final v in widget.vehicles) DropdownMenuItem(value: v.id, child: Text('${v.registrationNumber} · ${v.vehicleType}'))], onChanged: (v) => setState(() => _vehicleId = v)),
      const SizedBox(height: 12),
      TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes (optional)')),
    ])),
    actions: [
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
      FilledButton(onPressed: _driverId == null || _vehicleId == null ? null : () => Navigator.pop(context, (_driverId!, _vehicleId!, _notes.text)), child: const Text('Assign')),
    ],
  );
}

class DutySchedulesTab extends ConsumerWidget {
  const DutySchedulesTab({super.key});
  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final drivers = ref.read(driversProvider).valueOrNull ?? const <Driver>[];
    if (drivers.isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add a driver before scheduling a shift.'))); return; }
    final value = await showDialog<(String, DateTime, DateTime, String)?>(context: context, builder: (_) => _ScheduleDialog(drivers: drivers));
    if (value == null) return;
    try {
      await ref.read(adminRepositoryProvider).createDutySchedule(driverId: value.$1, start: value.$2, end: value.$3, notes: value.$4);
      ref.invalidate(_dutySchedulesProvider);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Duty shift scheduled.')));
    } catch (_) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not schedule this shift. Check the time range.'))); }
  }
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_dutySchedulesProvider);
    return Column(children: [
      Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 8), child: Row(children: [
        Expanded(child: Text('Driver duty roster', style: Theme.of(context).textTheme.titleMedium)),
        FilledButton.tonalIcon(onPressed: () => _create(context, ref), icon: const Icon(Icons.add), label: const Text('Schedule')),
      ])),
      Expanded(child: RefreshIndicator(onRefresh: () async => ref.invalidate(_dutySchedulesProvider), child: async.when(
        loading: () => const LoadingState(label: 'Loading duty schedules…'),
        error: (_, __) => EmptyState(icon: Icons.cloud_off_outlined, title: 'Schedules unavailable', message: 'Refresh to try again.', actionLabel: 'Retry', onAction: () => ref.invalidate(_dutySchedulesProvider)),
        data: (rows) => rows.isEmpty ? const EmptyState(icon: Icons.calendar_month_outlined, title: 'No shifts scheduled', message: 'Create a duty shift to start building the roster.') : ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.all(16), itemCount: rows.length, separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (context, i) { final row = rows[i]; return Card(child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.schedule)), title: Text('${row['driverName'] ?? 'Driver'}'),
            subtitle: Text('${_dateLabel(row['startTime'])}\nUntil ${_dateLabel(row['endTime'])} · ${row['status'] is num ? ['Scheduled', 'Active', 'Completed', 'Cancelled'][(row['status'] as num).toInt().clamp(0, 3)] : row['status']}'), isThreeLine: true,
            trailing: PopupMenuButton<String>(onSelected: (choice) async { if (choice == 'delete') { try { await ref.read(adminRepositoryProvider).deleteDutySchedule('${row['id']}'); ref.invalidate(_dutySchedulesProvider); } catch (_) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not remove shift.'))); } } }, itemBuilder: (_) => const [PopupMenuItem(value: 'delete', child: Text('Delete shift'))]),
          )); },
        ),
      ))),
    ]);
  }
}

class _ScheduleDialog extends StatefulWidget {
  const _ScheduleDialog({required this.drivers});
  final List<Driver> drivers;
  @override
  State<_ScheduleDialog> createState() => _ScheduleDialogState();
}
class _ScheduleDialogState extends State<_ScheduleDialog> {
  String? _driver;
  DateTime _start = DateTime.now().add(const Duration(hours: 1));
  DateTime _end = DateTime.now().add(const Duration(hours: 9));
  final _notes = TextEditingController();
  @override
  void dispose() { _notes.dispose(); super.dispose(); }
  Future<void> _pick(bool start) async {
    final date = await showDatePicker(context: context, initialDate: start ? _start : _end, firstDate: DateTime.now().subtract(const Duration(days: 365)), lastDate: DateTime.now().add(const Duration(days: 730)));
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(start ? _start : _end));
    if (time == null) return;
    setState(() { final value = DateTime(date.year, date.month, date.day, time.hour, time.minute); if (start) { _start = value; } else { _end = value; } });
  }
  @override
  Widget build(BuildContext context) => AlertDialog(
    title: const Text('Schedule driver shift'),
    content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
      DropdownButtonFormField<String>(initialValue: _driver, decoration: const InputDecoration(labelText: 'Driver'), items: [for (final d in widget.drivers) DropdownMenuItem(value: d.id, child: Text(d.fullName))], onChanged: (v) => setState(() => _driver = v)),
      const SizedBox(height: 8), ListTile(contentPadding: EdgeInsets.zero, title: const Text('Start'), subtitle: Text(_dateLabel(_start.toIso8601String())), trailing: const Icon(Icons.edit_calendar), onTap: () => _pick(true)),
      ListTile(contentPadding: EdgeInsets.zero, title: const Text('End'), subtitle: Text(_dateLabel(_end.toIso8601String())), trailing: const Icon(Icons.edit_calendar), onTap: () => _pick(false)),
      TextField(controller: _notes, decoration: const InputDecoration(labelText: 'Notes (optional)')),
    ])),
    actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: _driver == null || !_end.isAfter(_start) ? null : () => Navigator.pop(context, (_driver!, _start, _end, _notes.text)), child: const Text('Save shift'))],
  );
}

class MaintenanceTab extends ConsumerWidget {
  const MaintenanceTab({super.key});
  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final vehicles = ref.read(vehiclesProvider).valueOrNull ?? const <Vehicle>[];
    if (vehicles.isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add a vehicle before recording maintenance.'))); return; }
    final value = await showDialog<(String, String, double, String)?>(context: context, builder: (_) => _MaintenanceDialog(vehicles: vehicles));
    if (value == null) return;
    try {
      await ref.read(adminRepositoryProvider).createMaintenanceRecord(vehicleId: value.$1, date: DateTime.now(), type: value.$2, cost: value.$3, description: value.$4);
      ref.invalidate(_maintenanceRecordsProvider); ref.invalidate(vehiclesProvider);
    } catch (_) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save maintenance record.'))); }
  }
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_maintenanceRecordsProvider);
    return Column(children: [
      Padding(padding: const EdgeInsets.fromLTRB(16, 12, 16, 8), child: Row(children: [Expanded(child: Text('Maintenance & repairs', style: Theme.of(context).textTheme.titleMedium)), FilledButton.tonalIcon(onPressed: () => _create(context, ref), icon: const Icon(Icons.add), label: const Text('Record'))])),
      Expanded(child: RefreshIndicator(onRefresh: () async => ref.invalidate(_maintenanceRecordsProvider), child: async.when(
        loading: () => const LoadingState(label: 'Loading maintenance…'),
        error: (_, __) => EmptyState(icon: Icons.cloud_off_outlined, title: 'Maintenance unavailable', message: 'Refresh to try again.', actionLabel: 'Retry', onAction: () => ref.invalidate(_maintenanceRecordsProvider)),
        data: (rows) => rows.isEmpty ? const EmptyState(icon: Icons.build_outlined, title: 'No maintenance records', message: 'Record servicing and repairs to keep fleet history current.') : ListView.separated(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.all(16), itemCount: rows.length, separatorBuilder: (_, __) => const SizedBox(height: 10), itemBuilder: (context, i) { final row = rows[i]; final status = row['status'] is num ? ['Scheduled', 'In progress', 'Completed', 'Cancelled'][(row['status'] as num).toInt().clamp(0, 3)] : '${row['status']}'; return Card(child: ListTile(leading: const CircleAvatar(child: Icon(Icons.build_outlined)), title: Text('${row['maintenanceType'] ?? 'Maintenance'}'), subtitle: Text('${row['vehicleRegistrationNumber'] ?? 'Vehicle'} · ${_dateLabel(row['maintenanceDate'])}\n$status · Rs. ${row['cost'] ?? 0}'), isThreeLine: true, trailing: PopupMenuButton<String>(onSelected: (choice) async { if (choice == 'delete') { try { await ref.read(adminRepositoryProvider).deleteMaintenanceRecord('${row['id']}'); ref.invalidate(_maintenanceRecordsProvider); } catch (_) { if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not remove record.'))); } } }, itemBuilder: (_) => const [PopupMenuItem(value: 'delete', child: Text('Delete record'))]))); }),
      ))),
    ]);
  }
}

class _MaintenanceDialog extends StatefulWidget {
  const _MaintenanceDialog({required this.vehicles});
  final List<Vehicle> vehicles;
  @override
  State<_MaintenanceDialog> createState() => _MaintenanceDialogState();
}
class _MaintenanceDialogState extends State<_MaintenanceDialog> {
  String? _vehicle;
  final _type = TextEditingController();
  final _cost = TextEditingController(text: '0');
  final _description = TextEditingController();
  @override
  void dispose() { _type.dispose(); _cost.dispose(); _description.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => AlertDialog(title: const Text('New maintenance record'), content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
    DropdownButtonFormField<String>(initialValue: _vehicle, decoration: const InputDecoration(labelText: 'Vehicle'), items: [for (final v in widget.vehicles) DropdownMenuItem(value: v.id, child: Text(v.registrationNumber))], onChanged: (v) => setState(() => _vehicle = v)),
    const SizedBox(height: 10), TextField(controller: _type, decoration: const InputDecoration(labelText: 'Service / repair type')),
    const SizedBox(height: 10), TextField(controller: _cost, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Cost (Rs.)')),
    const SizedBox(height: 10), TextField(controller: _description, maxLines: 2, decoration: const InputDecoration(labelText: 'Description (optional)')),
  ])), actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')), FilledButton(onPressed: _vehicle == null || _type.text.trim().isEmpty || (double.tryParse(_cost.text) ?? -1) < 0 ? null : () => Navigator.pop(context, (_vehicle!, _type.text, double.parse(_cost.text), _description.text)), child: const Text('Save record'))]);
}

class _Pill extends StatelessWidget {
  const _Pill(this.label, {required this.active});
  final String label; final bool active;
  @override
  Widget build(BuildContext context) => DecoratedBox(decoration: BoxDecoration(color: (active ? AppTheme.success : AppTheme.muted).withValues(alpha: .1), borderRadius: BorderRadius.circular(30)), child: Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), child: Text(label, style: TextStyle(color: active ? AppTheme.success : AppTheme.muted, fontSize: 12, fontWeight: FontWeight.w700))));
}
