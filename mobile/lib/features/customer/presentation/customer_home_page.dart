import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../messaging/presentation/messages_page.dart';
import '../../notifications/presentation/notification_bell.dart';
import 'tabs/customer_orders_tab.dart';
import 'tabs/customer_profile_tab.dart';
import 'tabs/customer_track_tab.dart';
import 'tabs/new_order_tab.dart';

/// CUSTOMER home shell: bottom navigation across the customer screens.
/// Each tab is built out in its own phase (Orders → P2, New Order → P3,
/// Checkout → P4, Track → P5). Profile is here from Phase 1.
class CustomerHomePage extends ConsumerStatefulWidget {
  const CustomerHomePage({super.key});

  @override
  ConsumerState<CustomerHomePage> createState() => _CustomerHomePageState();
}

class _CustomerHomePageState extends ConsumerState<CustomerHomePage> {
  int _index = 0;

  static const _titles = ['My Orders', 'New Order', 'Track', 'Profile'];

  late final List<Widget> _tabs = const [
    CustomerOrdersTab(),
    NewOrderTab(),
    CustomerTrackTab(),
    CustomerProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(
            tooltip: 'Messages',
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const MessagesPage()),
            ),
          ),
          const NotificationBell(),
        ],
      ),
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.add_box_outlined), selectedIcon: Icon(Icons.add_box), label: 'New'),
          NavigationDestination(icon: Icon(Icons.local_shipping_outlined), selectedIcon: Icon(Icons.local_shipping), label: 'Track'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
