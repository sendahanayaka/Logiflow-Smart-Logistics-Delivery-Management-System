import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/coming_soon.dart';

/// Approvals queue — built in Phase 2 (agent plan + Approve/Reject/Revise).
class ApprovalsTab extends ConsumerWidget {
  const ApprovalsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      const ComingSoon(icon: Icons.verified_outlined, title: 'Approvals', phase: 'Phase 2');
}
