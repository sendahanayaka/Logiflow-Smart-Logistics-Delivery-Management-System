import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/admin_repository.dart';
import '../../data/models/admin_shipment.dart';
import '../../data/models/app_user.dart';
import '../../data/models/fleet.dart';
import '../../data/models/workflow.dart';

/// Workflows, optionally filtered by status (null = all). Refresh via
/// ref.invalidate(workflowsProvider(status)).
final workflowsProvider =
    FutureProvider.autoDispose.family<List<WorkflowSummary>, String?>(
  (ref, status) => ref.read(adminRepositoryProvider).workflows(status: status),
);

/// A single workflow's full plan + allocation.
final workflowDetailProvider =
    FutureProvider.autoDispose.family<WorkflowDetail, String>(
  (ref, id) => ref.read(adminRepositoryProvider).workflow(id),
);

final shipmentsProvider = FutureProvider.autoDispose<List<AdminShipment>>(
  (ref) => ref.read(adminRepositoryProvider).shipments(),
);

final driversProvider = FutureProvider.autoDispose<List<Driver>>(
  (ref) => ref.read(adminRepositoryProvider).drivers(),
);

final vehiclesProvider = FutureProvider.autoDispose<List<Vehicle>>(
  (ref) => ref.read(adminRepositoryProvider).vehicles(),
);

final usersProvider = FutureProvider.autoDispose<List<AppUser>>(
  (ref) => ref.read(adminRepositoryProvider).users(),
);

final rolesProvider = FutureProvider.autoDispose<List<Role>>(
  (ref) => ref.read(adminRepositoryProvider).roles(),
);
