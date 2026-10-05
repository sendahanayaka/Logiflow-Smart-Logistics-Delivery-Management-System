import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_state.dart';
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
    'All',
    'Pending',
    'Planning',
    'AwaitingApproval',
    'Approved',
    'Completed',
    'Rejected',
    'Failed',
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
              loading: () => const LoadingState(label: 'Loading workflows…'),
              error: (e, _) => EmptyState(
                icon: Icons.cloud_off_outlined,
                title: 'Workflows unavailable',
                message: 'Check the connection and try again.',
                actionLabel: 'Retry',
                onAction: () => ref.invalidate(workflowsProvider(null)),
              ),
              data: (all) {
                final list = _filter == 'All'
                    ? all
                    : all.where((w) => w.status == _filter).toList();
                if (list.isEmpty) {
                  return EmptyState(
                    icon: Icons.timeline_outlined,
                    title: _filter == 'All'
                        ? 'No workflows yet'
                        : 'No $_filter workflows',
                    message:
                        'Workflows will appear here as orders move through planning.',
                  );
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
            MaterialPageRoute(
                builder: (_) => ApprovalDetailPage(
                    workflowId: workflow.id, readOnly: true)),
          );
          ref.invalidate(workflowsProvider(null));
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                    child: Text(workflow.workflowKey,
                        style: const TextStyle(fontWeight: FontWeight.bold))),
                WorkflowStatusChip(workflow.status),
              ]),
              if ((workflow.objective ?? '').isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(workflow.objective!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.black87)),
              ],
              const SizedBox(height: 6),
              Row(children: [
                const Icon(Icons.place_outlined,
                    size: 15, color: Colors.black45),
                const SizedBox(width: 4),
                Text('${workflow.stopCount} stops',
                    style:
                        const TextStyle(color: Colors.black54, fontSize: 12)),
                const Spacer(),
                Text(DateFormat('d MMM, h:mm a').format(when),
                    style:
                        const TextStyle(color: Colors.black45, fontSize: 12)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
