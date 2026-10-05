import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/auth/session_controller.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/loading_state.dart';
import '../../auth/presentation/login_page.dart' show friendlyError;
import '../data/admin_repository.dart';
import '../data/models/workflow.dart';
import 'controllers/admin_providers.dart';
import 'widgets/workflow_status_chip.dart';

/// Review the agent's routing plan + allocation, then Approve / Reject / Revise.
class ApprovalDetailPage extends ConsumerStatefulWidget {
  const ApprovalDetailPage(
      {super.key, required this.workflowId, this.readOnly = false});
  final String workflowId;
  final bool readOnly;

  @override
  ConsumerState<ApprovalDetailPage> createState() => _ApprovalDetailPageState();
}

class _ApprovalDetailPageState extends ConsumerState<ApprovalDetailPage> {
  bool _busy = false;
  ApprovalResult? _result;
  String? _error;

  String get _decidedBy {
    final u = ref.read(sessionControllerProvider).user;
    return (u?.name.isNotEmpty ?? false)
        ? u!.name
        : (u?.email ?? 'ops-manager');
  }

  Future<void> _decide(String action, WorkflowDetail wf,
      {String? reason}) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final res = await ref.read(adminRepositoryProvider).approve(
            wf.id,
            action: action,
            decidedBy: _decidedBy,
            reason: reason,
            driverId: action == 'Approve' ? wf.allocatedDriverId : null,
            vehicleId: action == 'Approve' ? wf.allocatedVehicleId : null,
          );
      ref.invalidate(workflowDetailProvider(wf.id));
      ref.invalidate(workflowsProvider(null));
      if (mounted) setState(() => _result = res);
    } catch (e) {
      if (mounted) {
        setState(() =>
            _error = friendlyError(e, 'The decision could not be recorded.'));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _decideWithReason(String action, WorkflowDetail wf) async {
    final controller = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('$action plan'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 3,
          decoration: InputDecoration(
            labelText: action == 'Reject'
                ? 'Reason for rejection'
                : 'What should be revised?',
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              child: Text(action)),
        ],
      ),
    );
    if (reason == null) return; // cancelled
    await _decide(action, wf, reason: reason.isEmpty ? null : reason);
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(workflowDetailProvider(widget.workflowId));

    return Scaffold(
      appBar: AppBar(title: const Text('Review Plan')),
      body: async.when(
        loading: () => const LoadingState(label: 'Loading approval details…'),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Text("Couldn't load this plan."),
            const SizedBox(height: 12),
            OutlinedButton(
                onPressed: () =>
                    ref.invalidate(workflowDetailProvider(widget.workflowId)),
                child: const Text('Retry')),
          ]),
        ),
        data: (wf) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _header(wf),
            if ((wf.summary ?? '').isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('“${wf.summary}”',
                      style: const TextStyle(fontStyle: FontStyle.italic)),
                ),
              ),
            ],
            if ((wf.allocationSummary ?? '').isNotEmpty ||
                wf.allocatedDriverId != null) ...[
              const SizedBox(height: 12),
              _allocationCard(wf),
            ],
            const SizedBox(height: 12),
            _stopsCard(wf),
            if (_result != null) ...[
              const SizedBox(height: 16),
              _resultCard(_result!),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            if (_result == null) _actions(wf),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _header(WorkflowDetail wf) => Card(
        color: AppTheme.navy,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text(wf.workflowKey,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold)),
              ),
              WorkflowStatusChip(wf.status),
            ]),
            if ((wf.objective ?? '').isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(wf.objective!,
                  style: const TextStyle(color: Colors.white70)),
            ],
            const SizedBox(height: 8),
            Text(
                '${wf.stopCount} stops · ${wf.totalDistanceKm.toStringAsFixed(1)} km total',
                style: const TextStyle(color: Colors.white60, fontSize: 12)),
          ]),
        ),
      );

  Widget _allocationCard(WorkflowDetail wf) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            const Text('🤖 ', style: TextStyle(fontSize: 18)),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Agent allocation',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(
                      (wf.allocationSummary ?? '').isNotEmpty
                          ? wf.allocationSummary!
                          : 'Driver & vehicle pre-selected by the allocation agent.',
                      style: const TextStyle(color: Colors.black54),
                    ),
                  ]),
            ),
          ]),
        ),
      );

  Widget _stopsCard(WorkflowDetail wf) {
    final stops = [...wf.stops]
      ..sort((a, b) => a.sequence.compareTo(b.sequence));
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('ROUTE PLAN',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.black54,
                  letterSpacing: 0.5)),
          const SizedBox(height: 8),
          for (final s in stops) _stopRow(s),
        ]),
      ),
    );
  }

  Widget _stopRow(RouteStop s) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          CircleAvatar(
              radius: 12,
              backgroundColor: AppTheme.navy,
              child: Text('${s.sequence}',
                  style: const TextStyle(color: Colors.white, fontSize: 12))),
          const SizedBox(width: 12),
          Expanded(
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(s.address,
                  style: const TextStyle(fontWeight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(
                  'ETA ${DateFormat('d MMM, h:mm a').format(s.eta)} · ${s.distanceFromPrevKm.toStringAsFixed(1)} km',
                  style: const TextStyle(color: Colors.black54, fontSize: 12)),
            ]),
          ),
          if (s.onTime != null)
            Icon(s.onTime! ? Icons.check_circle : Icons.warning_amber,
                size: 18, color: s.onTime! ? Colors.green : Colors.orange),
        ]),
      );

  Widget _resultCard(ApprovalResult r) => Card(
        color: const Color(0xFFECFDF5),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.check_circle, color: Colors.green),
              const SizedBox(width: 8),
              Text('Decision recorded (${r.status})',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, color: Color(0xFF065F46))),
            ]),
            const SizedBox(height: 8),
            Text(r.message, style: const TextStyle(color: Color(0xFF047857))),
            if (r.shipmentCode != null) ...[
              const SizedBox(height: 4),
              Text('Shipment ${r.shipmentCode}',
                  style: const TextStyle(
                      color: Color(0xFF047857), fontWeight: FontWeight.w600)),
            ],
            const SizedBox(height: 12),
            FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Done')),
          ]),
        ),
      );

  Widget _actions(WorkflowDetail wf) {
    final canDecide = !widget.readOnly && wf.isAwaitingApproval;
    if (!canDecide) {
      return Center(
        child: Text(
          widget.readOnly
              ? 'Read-only view.'
              : 'This plan is ${wf.status} — no action needed.',
          style: const TextStyle(color: Colors.black54),
        ),
      );
    }
    return Column(children: [
      FilledButton.icon(
        onPressed: _busy ? null : () => _decide('Approve', wf),
        icon: const Icon(Icons.check),
        label: Text(_busy ? 'Working…' : 'Approve & dispatch'),
        style: FilledButton.styleFrom(backgroundColor: Colors.green),
      ),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _busy ? null : () => _decideWithReason('Revise', wf),
            icon: const Icon(Icons.edit),
            label: const Text('Revise'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _busy ? null : () => _decideWithReason('Reject', wf),
            icon: const Icon(Icons.close),
            label: const Text('Reject'),
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
          ),
        ),
      ]),
    ]);
  }
}
