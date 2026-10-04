import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/coming_soon.dart';

/// User management — built in Phase 6 (list, create, role, activate/deactivate).
class UsersTab extends ConsumerWidget {
  const UsersTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      const ComingSoon(icon: Icons.people_outline, title: 'Users', phase: 'Phase 6');
}
