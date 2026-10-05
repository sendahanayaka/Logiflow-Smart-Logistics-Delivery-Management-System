import 'package:flutter/material.dart';

/// Consistent, compact empty/loading failure treatment for list surfaces.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(28),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: colors.secondary.withValues(alpha: 0.09),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Icon(icon, size: 32, color: colors.secondary),
                  ),
                  const SizedBox(height: 18),
                  Text(title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleLarge),
                  if (message != null) ...[
                    const SizedBox(height: 8),
                    Text(message!,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: const Color(0xFF5E6982), height: 1.5)),
                  ],
                  if (actionLabel != null && onAction != null) ...[
                    const SizedBox(height: 18),
                    OutlinedButton.icon(
                        onPressed: onAction,
                        icon: const Icon(Icons.refresh),
                        label: Text(actionLabel!)),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
