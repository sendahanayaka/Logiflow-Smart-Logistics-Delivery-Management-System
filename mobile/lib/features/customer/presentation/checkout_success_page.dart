import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Shown after a successful checkout.
class CheckoutSuccessPage extends StatelessWidget {
  const CheckoutSuccessPage({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, color: Colors.green, size: 88),
              const SizedBox(height: 16),
              const Text('Order confirmed!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text(
                'Your delivery is being prepared. Track its progress from the Track tab.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54),
              ),
              const SizedBox(height: 28),
              FilledButton.icon(
                onPressed: () => context.pushReplacement('/customer/order/$orderId/track'),
                icon: const Icon(Icons.local_shipping),
                label: const Text('Track delivery'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => context.pushReplacement('/customer/order/$orderId'),
                child: const Text('View order'),
              ),
              TextButton(
                onPressed: () => context.go('/customer'),
                child: const Text('Back to my orders'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
