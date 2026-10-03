import 'package:flutter/material.dart';

import '../../../core/widgets/role_scaffold.dart';

/// WAREHOUSE_STAFF home. Build the warehouse screens under features/warehouse/.
class WarehouseHomePage extends StatelessWidget {
  const WarehouseHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return const RoleScaffold(
      title: 'Warehouse',
      owner: 'Warehouse slice',
      todo: [
        'Warehouses list + create (GET/POST /warehouse)',
        'Storage zones (GET/POST /warehouse/{id}/zones)',
        'Package intake (POST /warehouse/intake) + mark available',
        'Inventory (GET /warehouse/{id}/packages)',
        'Dispatch: build batch + validate + "Plan route & send to ops" (/dispatch, /workflows/from-batch/{id})',
        'Throughput report (GET /warehouse/{id}/reports/throughput)',
      ],
    );
  }
}
