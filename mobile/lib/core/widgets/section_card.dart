import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Shared white surface for related information and action groups.
class SectionCard extends StatelessWidget {
  const SectionCard({
    super.key,
    required this.title,
    required this.child,
    this.icon,
    this.padding = const EdgeInsets.all(AppTheme.space4),
  });

  final String title;
  final Widget child;
  final IconData? icon;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: padding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 19, color: AppTheme.navy),
                    const SizedBox(width: AppTheme.space2),
                  ],
                  Expanded(
                    child: Text(title,
                        style: Theme.of(context).textTheme.titleMedium),
                  ),
                ],
              ),
              const SizedBox(height: AppTheme.space3),
              child,
            ],
          ),
        ),
      );
}

/// Aligned, wrapping label/value pair for shipment, order and profile details.
class InfoRow extends StatelessWidget {
  const InfoRow({
    super.key,
    required this.label,
    required this.value,
    this.valueColor,
    this.labelFlex = 2,
    this.valueFlex = 3,
  });

  final String label;
  final String value;
  final Color? valueColor;
  final int labelFlex;
  final int valueFlex;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: AppTheme.space3),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: labelFlex,
              child: Text(label,
                  style: Theme.of(context)
                      .textTheme
                      .bodySmall
                      ?.copyWith(fontWeight: FontWeight.w600)),
            ),
            const SizedBox(width: AppTheme.space3),
            Expanded(
              flex: valueFlex,
              child: Text(value,
                  textAlign: TextAlign.end,
                  softWrap: true,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: valueColor ?? AppTheme.text,
                        fontWeight: FontWeight.w600,
                      )),
            ),
          ],
        ),
      );
}
