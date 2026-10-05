import 'package:flutter/material.dart';

/// Placeholder for an admin section that's built in a later phase.
class ComingSoon extends StatelessWidget {
  const ComingSoon({super.key, required this.icon, required this.title, required this.phase});
  final IconData icon;
  final String title;
  final String phase;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 64, color: Colors.black26),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text('Coming in $phase', style: const TextStyle(color: Colors.black45)),
        ],
      ),
    );
  }
}
