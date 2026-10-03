import 'package:flutter/material.dart';

import '../../../core/widgets/role_scaffold.dart';

/// CUSTOMER home. Build the customer screens under features/customer/.
class CustomerHomePage extends StatelessWidget {
  const CustomerHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const RoleScaffold(
      title: 'Customer',
      owner: 'Customer slice',
      todo: [
        'Create delivery order (addresses, package, window)',
        'Checkout + payment (COD / Card / Online) — fee shown at order time',
        'My Orders list',
        'Order details + live tracking (driver name/phone, ETA, status timeline)',
        'Track by shipment code',
      ],
    );
  }
}
