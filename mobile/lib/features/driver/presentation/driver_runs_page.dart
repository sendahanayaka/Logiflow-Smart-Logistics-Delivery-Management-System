import 'package:flutter/material.dart';

import '../../../core/widgets/role_scaffold.dart';

/// DRIVER home. Build the driver screens under features/driver/.
class DriverRunsPage extends StatelessWidget {
  const DriverRunsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const RoleScaffold(
      title: 'My Runs',
      owner: 'Driver slice',
      todo: [
        'My assigned runs (GET /shipments/mine)',
        'Run detail: ordered stops + route map + recipient name/phone/distance/ETA',
        'Mark en route / arrived (POST /shipments/{id}/events)',
        'Proof of delivery (POST /shipments/{id}/pod) — camera photo/signature',
        'QR scan at pickup/handover · GPS location (native mobile features)',
      ],
    );
  }
}
