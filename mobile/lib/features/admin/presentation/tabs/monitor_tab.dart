import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/coming_soon.dart';

/// Agent monitor — built in Phase 3 (all workflows + status filter).
class MonitorTab extends ConsumerWidget {
  const MonitorTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      const ComingSoon(icon: Icons.insights_outlined, title: 'Agent Monitor', phase: 'Phase 3');
}
