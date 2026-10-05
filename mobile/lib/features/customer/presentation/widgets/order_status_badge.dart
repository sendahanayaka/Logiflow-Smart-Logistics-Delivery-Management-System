import 'package:flutter/material.dart';

import '../../../../core/widgets/status_badge.dart';

/// Backward-compatible order badge backed by the shared app status system.
class OrderStatusBadge extends StatelessWidget {
  const OrderStatusBadge(this.status, {super.key});
  final String status;

  @override
  Widget build(BuildContext context) => StatusBadge(status);
}
