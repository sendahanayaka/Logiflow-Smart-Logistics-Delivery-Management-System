import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/coming_soon.dart';

/// Fleet — built in Phase 5 (drivers + vehicles with CRUD).
class FleetTab extends ConsumerWidget {
  const FleetTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      const ComingSoon(icon: Icons.directions_car_outlined, title: 'Fleet', phase: 'Phase 5');
}
