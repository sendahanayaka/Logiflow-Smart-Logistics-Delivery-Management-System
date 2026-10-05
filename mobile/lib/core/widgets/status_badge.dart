import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Shared status pill for orders, shipments, driver runs, users and workflows.
class StatusBadge extends StatelessWidget {
  const StatusBadge(this.status, {super.key, this.label});

  final String status;
  final String? label;

  ({Color background, Color foreground}) _colors(String value) {
    final key = value.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
    if ({
      'completed',
      'delivered',
      'approved',
      'confirmed',
      'available',
      'active',
      'onduty',
      'ontime',
      'success'
    }.contains(key)) {
      return (
        background: const Color(0xFFE6F7F0),
        foreground: AppTheme.success
      );
    }
    if ({
      'pending',
      'awaitingapproval',
      'awaitingdispatch',
      'created',
      'received',
      'onhold',
      'scheduled',
      'delayed',
      'offwindow',
      'warning'
    }.contains(key)) {
      return (
        background: const Color(0xFFFFF4E5),
        foreground: AppTheme.warning
      );
    }
    if ({
      'cancelled',
      'canceled',
      'rejected',
      'failed',
      'inactive',
      'suspended',
      'outofservice',
      'error'
    }.contains(key)) {
      return (background: const Color(0xFFFCE8EC), foreground: AppTheme.danger);
    }
    if ({
      'dispatched',
      'intransit',
      'enroute',
      'arrived',
      'planning',
      'inmaintenance',
      'maintenance',
      'info'
    }.contains(key)) {
      return (background: const Color(0xFFEAF2FF), foreground: AppTheme.info);
    }
    return (background: const Color(0xFFF0F1F7), foreground: AppTheme.muted);
  }

  @override
  Widget build(BuildContext context) {
    final value = label ?? (status.isEmpty ? '—' : status);
    final colors = _colors(status);
    return Container(
      constraints: const BoxConstraints(minHeight: 26),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        value,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colors.foreground,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.1,
            ),
      ),
    );
  }
}
