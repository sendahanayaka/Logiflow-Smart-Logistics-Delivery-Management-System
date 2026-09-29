// [S4] Delivery / workflow types — mirror the backend DTOs (camelCase over the wire).

export type WorkflowStatus =
  | 'Pending' | 'Planning' | 'AwaitingApproval' | 'Approved'
  | 'Rejected' | 'Completed' | 'Failed';

export type ApprovalAction = 'APPROVE' | 'REJECT' | 'REVISE';

export interface WorkflowSummary {
  id: string;
  workflowKey: string;
  status: string;
  objective: string | null;
  summary: string | null;
  stopCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface RouteStop {
  id: string;
  sequence: number;
  stopKey: string;
  orderId: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceFromPrevKm: number;
  eta: string;
  windowStart: string | null;
  windowEnd: string | null;
  onTime: boolean | null;
  status: string;
}

export interface WorkflowResponse {
  id: string;
  workflowKey: string;
  dispatchBatchId: string;
  status: string;
  objective: string | null;
  summary: string | null;
  totalDistanceKm: number;
  stopCount: number;
  createdAt: string;
  stops: RouteStop[];
  allocatedDriverId: string | null;
  allocatedVehicleId: string | null;
  allocationSummary: string | null;
}

export interface ApprovalResult {
  workflowId: string;
  status: string;
  shipmentId: string | null;
  shipmentCode: string | null;
  message: string;
}

export interface ShipmentSummary {
  id: string;
  shipmentCode: string;
  status: string;
  driverId: string;
  vehicleId: string;
  totalDistanceKm: number;
  stopCount: number;
  deliveredCount: number;
  dispatchedAt: string | null;
  createdAt: string;
}

export interface TimelineEntry {
  sequence: number;
  stopKey: string;
  address: string;
  plannedEta: string;
  status: string;
  actualAt: string | null;
  note: string | null;
  onTime: boolean | null;
  latitude: number;
  longitude: number;
}

export interface TrackingView {
  shipmentId: string;
  shipmentCode: string;
  status: string;
  stops: TimelineEntry[];
}

export interface DriverRunView {
  shipmentId: string;
  shipmentCode: string;
  status: string;
  driverId: string;
  vehicleId: string;
  stops: TimelineEntry[];
}

// --- request bodies ---------------------------------------------------------

export interface TriggerWorkflowStop {
  stopKey: string;
  orderId: string;
  address: string;
  latitude: number;
  longitude: number;
  windowStart?: string | null;
  windowEnd?: string | null;
}

export interface TriggerWorkflowRequest {
  dispatchBatchId: string;
  objective?: string | null;
  deliveryWindowStart?: string | null;
  customerNotes?: string | null;
  stops: TriggerWorkflowStop[];
}

export interface ApproveWorkflowRequest {
  action: ApprovalAction;
  decidedBy: string;
  reason?: string | null;
  revisions?: Record<string, unknown> | null;
  driverId?: string | null;
  vehicleId?: string | null;
}

export interface RecordStopEventRequest {
  stopKey: string;
  kind: 'ARRIVED' | 'DEPARTED';
  occurredAt?: string | null;
  note?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface RecordPodRequest {
  stopKey: string;
  receivedByName?: string | null;
  signatureImageUrl?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  deliveredAt?: string | null;
}
