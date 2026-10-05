// Agent-workflow models — mirror the backend Workflows DTOs
// (WorkflowSummary, WorkflowResponse, RouteStopResponse, ApprovalResult).

double _d(dynamic v) => v == null ? 0 : (v as num).toDouble();
DateTime _dt(dynamic v) => DateTime.tryParse((v ?? '').toString()) ?? DateTime.now();
DateTime? _dtn(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());

/// Lightweight workflow row for the monitor / approval queue.
class WorkflowSummary {
  const WorkflowSummary({
    required this.id,
    required this.workflowKey,
    required this.status,
    this.objective,
    this.summary,
    required this.stopCount,
    required this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String workflowKey;
  final String status; // Pending|Planning|AwaitingApproval|Approved|Rejected|Completed|Failed
  final String? objective;
  final String? summary;
  final int stopCount;
  final DateTime createdAt;
  final DateTime? updatedAt;

  bool get isAwaitingApproval => status == 'AwaitingApproval';

  factory WorkflowSummary.fromJson(Map<String, dynamic> j) => WorkflowSummary(
        id: (j['id'] ?? '').toString(),
        workflowKey: (j['workflowKey'] ?? '') as String,
        status: (j['status'] ?? '') as String,
        objective: j['objective'] as String?,
        summary: j['summary'] as String?,
        stopCount: (j['stopCount'] as num?)?.toInt() ?? 0,
        createdAt: _dt(j['createdAt']),
        updatedAt: _dtn(j['updatedAt']),
      );
}

/// One planned stop in a routing plan.
class RouteStop {
  const RouteStop({
    required this.sequence,
    required this.stopKey,
    required this.orderId,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.distanceFromPrevKm,
    required this.eta,
    this.onTime,
    required this.status,
  });

  final int sequence;
  final String stopKey;
  final String orderId;
  final String address;
  final double latitude;
  final double longitude;
  final double distanceFromPrevKm;
  final DateTime eta;
  final bool? onTime;
  final String status;

  factory RouteStop.fromJson(Map<String, dynamic> j) => RouteStop(
        sequence: (j['sequence'] as num?)?.toInt() ?? 0,
        stopKey: (j['stopKey'] ?? '') as String,
        orderId: (j['orderId'] ?? '').toString(),
        address: (j['address'] ?? '') as String,
        latitude: _d(j['latitude']),
        longitude: _d(j['longitude']),
        distanceFromPrevKm: _d(j['distanceFromPrevKm']),
        eta: _dt(j['eta']),
        onTime: j['onTime'] as bool?,
        status: (j['status'] ?? '') as String,
      );
}

/// Full workflow detail incl. the agent's plan + allocation.
class WorkflowDetail {
  const WorkflowDetail({
    required this.id,
    required this.workflowKey,
    required this.dispatchBatchId,
    required this.status,
    this.objective,
    this.summary,
    required this.totalDistanceKm,
    required this.stopCount,
    required this.createdAt,
    required this.stops,
    this.allocatedDriverId,
    this.allocatedVehicleId,
    this.allocationSummary,
  });

  final String id;
  final String workflowKey;
  final String dispatchBatchId;
  final String status;
  final String? objective;
  final String? summary;
  final double totalDistanceKm;
  final int stopCount;
  final DateTime createdAt;
  final List<RouteStop> stops;
  final String? allocatedDriverId;
  final String? allocatedVehicleId;
  final String? allocationSummary;

  bool get isAwaitingApproval => status == 'AwaitingApproval';

  factory WorkflowDetail.fromJson(Map<String, dynamic> j) => WorkflowDetail(
        id: (j['id'] ?? '').toString(),
        workflowKey: (j['workflowKey'] ?? '') as String,
        dispatchBatchId: (j['dispatchBatchId'] ?? '').toString(),
        status: (j['status'] ?? '') as String,
        objective: j['objective'] as String?,
        summary: j['summary'] as String?,
        totalDistanceKm: _d(j['totalDistanceKm']),
        stopCount: (j['stopCount'] as num?)?.toInt() ?? 0,
        createdAt: _dt(j['createdAt']),
        stops: ((j['stops'] as List?) ?? const [])
            .map((e) => RouteStop.fromJson(e as Map<String, dynamic>))
            .toList(),
        allocatedDriverId: j['allocatedDriverId']?.toString(),
        allocatedVehicleId: j['allocatedVehicleId']?.toString(),
        allocationSummary: j['allocationSummary'] as String?,
      );
}

/// Outcome of an approval decision.
class ApprovalResult {
  const ApprovalResult({
    required this.workflowId,
    required this.status,
    this.shipmentId,
    this.shipmentCode,
    required this.message,
  });

  final String workflowId;
  final String status;
  final String? shipmentId;
  final String? shipmentCode;
  final String message;

  factory ApprovalResult.fromJson(Map<String, dynamic> j) => ApprovalResult(
        workflowId: (j['workflowId'] ?? '').toString(),
        status: (j['status'] ?? '') as String,
        shipmentId: j['shipmentId']?.toString(),
        shipmentCode: j['shipmentCode'] as String?,
        message: (j['message'] ?? '') as String,
      );
}
