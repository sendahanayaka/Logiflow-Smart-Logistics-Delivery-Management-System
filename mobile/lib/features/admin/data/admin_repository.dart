import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import 'models/admin_shipment.dart';
import 'models/app_user.dart';
import 'models/fleet.dart';
import 'models/workflow.dart';

/// Admin/ops data access (workflows, approvals, shipments, fleet, users),
/// returning typed models. All endpoints require the ADMIN role.
class AdminRepository {
  AdminRepository(this._dio);
  final Dio _dio;

  // --- Agent workflows + approval -------------------------------------------
  Future<List<WorkflowSummary>> workflows({String? status}) async {
    final res = await _dio.get('/workflows',
        queryParameters: status == null ? null : {'status': status});
    return (res.data as List).map((e) => WorkflowSummary.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<WorkflowDetail> workflow(String id) async {
    final res = await _dio.get('/workflows/$id');
    return WorkflowDetail.fromJson(res.data as Map<String, dynamic>);
  }

  /// action = Approve | Reject | Revise
  Future<ApprovalResult> approve(
    String id, {
    required String action,
    required String decidedBy,
    String? reason,
    String? driverId,
    String? vehicleId,
  }) async {
    final res = await _dio.post('/workflows/$id/approval', data: {
      'action': action,
      'decidedBy': decidedBy,
      if (reason != null) 'reason': reason,
      if (driverId != null) 'driverId': driverId,
      if (vehicleId != null) 'vehicleId': vehicleId,
    });
    return ApprovalResult.fromJson(res.data as Map<String, dynamic>);
  }

  // --- Shipments ------------------------------------------------------------
  Future<List<AdminShipment>> shipments() async {
    final res = await _dio.get('/shipments');
    return (res.data as List).map((e) => AdminShipment.fromJson(e as Map<String, dynamic>)).toList();
  }

  // --- Fleet: drivers -------------------------------------------------------
  Future<List<Driver>> drivers() async {
    final res = await _dio.get('/drivers');
    return (res.data as List).map((e) => Driver.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Driver> createDriver(Map<String, dynamic> body) async =>
      Driver.fromJson((await _dio.post('/drivers', data: body)).data as Map<String, dynamic>);

  Future<Driver> updateDriver(String id, Map<String, dynamic> body) async =>
      Driver.fromJson((await _dio.put('/drivers/$id', data: body)).data as Map<String, dynamic>);

  // --- Fleet: vehicles ------------------------------------------------------
  Future<List<Vehicle>> vehicles() async {
    final res = await _dio.get('/vehicles');
    return (res.data as List).map((e) => Vehicle.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Vehicle> createVehicle(Map<String, dynamic> body) async =>
      Vehicle.fromJson((await _dio.post('/vehicles', data: body)).data as Map<String, dynamic>);

  Future<Vehicle> updateVehicle(String id, Map<String, dynamic> body) async =>
      Vehicle.fromJson((await _dio.put('/vehicles/$id', data: body)).data as Map<String, dynamic>);

  Future<void> deleteVehicle(String id) async => _dio.delete('/vehicles/$id');

  // --- Users ----------------------------------------------------------------
  Future<List<AppUser>> users() async {
    final res = await _dio.get('/users');
    return (res.data as List).map((e) => AppUser.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Role>> roles() async {
    final res = await _dio.get('/users/roles');
    return (res.data as List).map((e) => Role.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AppUser> createUser(Map<String, dynamic> body) async =>
      AppUser.fromJson((await _dio.post('/users', data: body)).data as Map<String, dynamic>);

  Future<AppUser> changeRole(String id, String roleId) async =>
      AppUser.fromJson((await _dio.put('/users/$id/role', data: {'roleId': roleId})).data as Map<String, dynamic>);

  Future<AppUser> setStatus(String id, bool isActive) async =>
      AppUser.fromJson((await _dio.put('/users/$id/status', data: {'isActive': isActive})).data as Map<String, dynamic>);
}

final adminRepositoryProvider =
    Provider<AdminRepository>((ref) => AdminRepository(ref.read(dioProvider)));
