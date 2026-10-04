import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../data/models/workflow.dart';
import '../approval_detail_page.dart';
import '../controllers/admin_providers.dart';
import '../widgets/workflow_status_chip.dart';

/// Agent monitor: every workflow in the pipeline with a status filter.
/// Tap a row to inspect the plan (read-only). Pull-to-refresh to watch progress.
class MonitorTab extends ConsumerStatefulWidget {
  const MonitorTab({super.key});

  @override
  ConsumerState<MonitorTab> createState() => _MonitorTabState();
}

class _MonitorTabState extends ConsumerState<MonitorTab> {
  static const _filters = [
    'All', 'Pending', 'Planning', 'AwaitingApproval', 'Approved', 'Completed', 'Rejected', 'Failed',
  ];
  String _filter = 'All';

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(workflowsProvider(null));

    return Column(
      children: [
        SizedBox(
          height: 52,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            children: [
              for (final f in _filters)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(f),
                    selected: _filter == f,
                    onSelected: (_) => setState(() => _filter = f),
                  ),
                ),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => ref.invalidate(workflowsProvider(null)),
            child: async.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => ListView(children: [
                const SizedBox(height: 120),
                const Center(child: Text("Couldn't load workflows.")),
                const SizedBox(height: 12),
                Center(child: OutlinedButton(onPressed: () => ref.invalidate(workflowsProvider(null)), child: const Text('Retry'))),
              ]),
              data: (all) {
                final list = _filter == 'All' ? all : all.where((w) => w.status == _filter).toList();
                if (list.isEmpty) {
                  return ListView(children: [
                    const SizedBox(height: 120),
                    Center(child: Text(_filter == 'All' ? 'No workflows yet.' : 'No $_filter workflows.',
                        style: const TextStyle(color: Colors.black54))),
                  ]);
                }
                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) => _WorkflowRow(workflow: list[i]),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _WorkflowRow extends ConsumerWidget {
  const _WorkflowRow({required this.workflow});
  final WorkflowSummary workflow;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final when = workflow.updatedAt ?? workflow.createdAt;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => ApprovalDetailPage(workflowId: workflow.id, readOnly: true)),
          );
          ref.invalidate(workflowsProvider(null));
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(child: Text(workflow.workflowKey, style: const TextStyle(fontWeight: FontWeight.bold))),
                WorkflowStatusChip(workflow.status),
              ]),
              if ((workflow.objective ?? '').isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(workflow.objective!, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.black87)),
              ],
              const SizedBox(height: 6),
              Row(children: [
                const Icon(Icons.place_outlined, size: 15, color: Colors.black45),
                const SizedBox(width: 4),
                Text('${workflow.stopCount} stops', style: const TextStyle(color: Colors.black54, fontSize: 12)),
                const Spacer(),
                Text(DateFormat('d MMM, h:mm a').format(when), style: const TextStyle(color: Colors.black45, fontSize: 12)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
