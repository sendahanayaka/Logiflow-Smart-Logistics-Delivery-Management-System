import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/loading_state.dart';
import '../../../../core/widgets/status_badge.dart';
import '../../data/models/workflow.dart';
import '../approval_detail_page.dart';
import '../controllers/admin_providers.dart';

/// Approvals queue: workflows paused at the human gate (AwaitingApproval).
class ApprovalsTab extends ConsumerWidget {
  const ApprovalsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(workflowsProvider(null));

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(workflowsProvider(null)),
      child: async.when(
        loading: () => const LoadingState(label: 'Loading approval queue…'),
        error: (e, _) => EmptyState(
          icon: Icons.cloud_off_outlined,
          title: 'Approvals unavailable',
          message: 'Check the connection and try again.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(workflowsProvider(null)),
        ),
        data: (all) {
          final queue = all.where((w) => w.isAwaitingApproval).toList();
          if (queue.isEmpty) {
            return const EmptyState(
              icon: Icons.verified_outlined,
              title: 'You are all caught up',
              message: 'Plans waiting for review will appear here.',
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: queue.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _QueueCard(workflow: queue[i]),
          );
        },
      ),
    );
  }
}

class _QueueCard extends ConsumerWidget {
  const _QueueCard({required this.workflow});
  final WorkflowSummary workflow;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () async {
          await Navigator.of(context).push(
            MaterialPageRoute(
                builder: (_) => ApprovalDetailPage(workflowId: workflow.id)),
          );
          ref.invalidate(
              workflowsProvider(null)); // refresh queue after a decision
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                    child: Text(workflow.workflowKey,
                        style: const TextStyle(fontWeight: FontWeight.bold))),
                const StatusBadge('AwaitingApproval',
                    label: 'Awaiting approval'),
              ]),
              if ((workflow.objective ?? '').isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(workflow.objective!,
                    style: const TextStyle(color: Colors.black87)),
              ],
              const SizedBox(height: 8),
              Row(children: [
                const Icon(Icons.place_outlined,
                    size: 16, color: Colors.black45),
                const SizedBox(width: 6),
                Text('${workflow.stopCount} stops',
                    style:
                        const TextStyle(color: Colors.black54, fontSize: 13)),
                const Spacer(),
                Text(DateFormat('d MMM, h:mm a').format(workflow.createdAt),
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
