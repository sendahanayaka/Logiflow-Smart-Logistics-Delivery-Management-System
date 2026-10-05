import 'package:flutter/material.dart';

/// Coloured pill for an agent-workflow status.
class WorkflowStatusChip extends StatelessWidget {
  const WorkflowStatusChip(this.status, {super.key});
  final String status;

  @override
  Widget build(BuildContext context) {
    late final Color bg;
    late final Color fg;
    switch (status) {
      case 'Completed':
      case 'Approved':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF166534);
        break;
      case 'AwaitingApproval':
        bg = const Color(0xFFFFEDD5);
        fg = const Color(0xFF9A3412);
        break;
      case 'Rejected':
      case 'Failed':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        break;
      case 'Planning':
      case 'Pending':
      default:
        bg = const Color(0xFFE0E7FF);
        fg = const Color(0xFF3730A3);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(status.isEmpty ? '—' : status,
          style: TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
