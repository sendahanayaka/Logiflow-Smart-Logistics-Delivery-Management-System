import 'package:flutter/material.dart';

import '../../../core/widgets/role_scaffold.dart';

/// ADMIN (ops manager) home. Build the admin screens under features/admin/.
class AdminDashboardPage extends StatelessWidget {
  const AdminDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const RoleScaffold(
      title: 'Ops Dashboard',
      owner: 'Admin slice',
      todo: [
        'Approvals queue: review agent plan + Approve/Reject (POST /workflows/{id}/approval)',
        'Agent monitor: workflows + stages (GET /workflows)',
        'Shipments list (GET /shipments)',
        'Fleet: drivers & vehicles (GET/POST /drivers, /vehicles)',
        'User management (GET/POST /users, roles)',
      ],
    );
  }
}
