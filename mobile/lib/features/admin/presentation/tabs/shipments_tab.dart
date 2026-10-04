import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/coming_soon.dart';

/// Shipments list — built in Phase 4 (all dispatched shipments + detail).
class ShipmentsTab extends ConsumerWidget {
  const ShipmentsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      const ComingSoon(icon: Icons.local_shipping_outlined, title: 'Shipments', phase: 'Phase 4');
}
