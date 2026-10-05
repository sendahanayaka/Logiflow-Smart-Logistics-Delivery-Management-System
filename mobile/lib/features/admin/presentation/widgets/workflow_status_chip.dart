import 'package:flutter/material.dart';

import '../../../../core/widgets/status_badge.dart';

/// Backward-compatible workflow badge backed by the shared app status system.
class WorkflowStatusChip extends StatelessWidget {
  const WorkflowStatusChip(this.status, {super.key});
  final String status;

  @override
  Widget build(BuildContext context) => StatusBadge(status);
}
