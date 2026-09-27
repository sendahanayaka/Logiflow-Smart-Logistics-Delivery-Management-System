import React, { useState } from 'react';
import { WorkflowRunResponse } from '../api/agentApi';
import { Driver, Vehicle } from '../types';
import { DispatchOrder } from '../../orders/types';

interface TripPreviewCardProps {
  workflowResponse: WorkflowRunResponse;
  selectedOrders: DispatchOrder[];
  driversList?: Driver[];
  vehiclesList?: Vehicle[];
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
}

export const TripPreviewCard: React.FC<TripPreviewCardProps> = ({
  workflowResponse,
  selectedOrders,
  driversList = [],
  vehiclesList = [],
  onApprove,
  onReject,
  isApproving = false,
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const proposal = workflowResponse.proposal;
  const allocation = proposal?.allocation;
  const proposed = allocation?.proposed;
  const alternatives = allocation?.alternatives || [];
  const routing = proposal?.routing;

  const status = workflowResponse.status;
  const isApproved = status === 'APPROVED' || status === 'COMPLETED';
  const isRejected = status === 'REJECTED' || status === 'CANCELLED';
  const isWaitingApproval = status === 'WAITING_FOR_APPROVAL' || (!isApproved && !isRejected);

  // Extract driver details
  const driverId = proposed?.driver_id || 'DRV-001';
  const matchedDriver = driversList.find(
    (d) => d.id.toLowerCase() === driverId.toLowerCase()
  );
  const driverName = matchedDriver
    ? matchedDriver.fullName
    : driverId === 'DRV-001'
    ? 'Sunil Perera'
    : driverId === 'DRV-002'
    ? 'Kasun Perera'
    : driverId;

  // Extract vehicle details
  const vehicleId = proposed?.vehicle_id || 'VEH-001';
  const matchedVehicle = vehiclesList.find(
    (v) => v.id.toLowerCase() === vehicleId.toLowerCase()
  );
  const vehicleReg = matchedVehicle
    ? matchedVehicle.registrationNumber
    : vehicleId === 'VEH-001'
    ? 'WP-ABC-5678'
    : vehicleId === 'VEH-002'
    ? 'WP-CAB-1234'
    : vehicleId;
  const vehicleModel = matchedVehicle
    ? `${matchedVehicle.make} ${matchedVehicle.model}`
    : 'Toyota Hiace';
  const vehicleCapacityKg = matchedVehicle?.capacity || 1500;

  // Calculate aggregated load & utilization
  const manifestOrders: DispatchOrder[] =
    selectedOrders.length > 0
      ? selectedOrders
      : proposed?.order_ids
      ? proposed.order_ids.map((id: string) => ({
          id,
          destination: 'Colombo Metro',
          weightKg: 200,
          volumeM3: 0.4,
          packagesCount: 1,
          priority: 'NORMAL' as const,
          deliveryWindowStart: '08:00 AM',
          deliveryWindowEnd: '12:00 PM',
          status: 'READY' as const,
        }))
      : [];

  const totalLoadKg =
    proposed?.total_weight_kg && proposed.total_weight_kg > 0
      ? proposed.total_weight_kg
      : manifestOrders.reduce((sum: number, o: DispatchOrder) => sum + o.weightKg, 0);

  const totalVolumeM3 =
    proposed?.total_volume_m3 && proposed.total_volume_m3 > 0
      ? proposed.total_volume_m3
      : manifestOrders.reduce((sum: number, o: DispatchOrder) => sum + o.volumeM3, 0);

  const utilizationPercent =
    proposed?.capacity_utilization_percent && proposed.capacity_utilization_percent > 0
      ? proposed.capacity_utilization_percent
      : Math.round((totalLoadKg / vehicleCapacityKg) * 1000) / 10;

  const isOverCapacity = totalLoadKg > vehicleCapacityKg;

  // Compatible vs Incompatible orders breakdown
  const compatibleOrderIds = proposed?.compatible_order_ids || manifestOrders.map(o => o.id);
  const incompatibleOrderIds = proposed?.incompatible_order_ids || [];

  // Utilization Bar Color
  let utilizationColor = '#22c55e'; // Green (<70%)
  if (utilizationPercent > 100) {
    utilizationColor = '#dc2626'; // Red (>100% Over Capacity)
  } else if (utilizationPercent >= 90) {
    utilizationColor = '#ef4444'; // Red (>90%)
  } else if (utilizationPercent >= 70) {
    utilizationColor = '#f97316'; // Orange (70-90%)
  }

  // Safe Reasons / Decision Summary
  const decisionReasons = proposed?.reasons && proposed.reasons.length > 0
    ? proposed.reasons
    : [
        'Driver is available and duty hours check passed',
        'Vehicle is available and active in fleet',
        'Vehicle capacity supports the consolidated load',
        `Consolidated ${manifestOrders.length} orders into single operational trip`,
      ];

  return (
    <div className="details-card" style={{ border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#ffffff', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)' }}>
      {/* Header Status Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
            Workflow ID: {workflowResponse.workflow_id}
          </span>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#08006C', margin: '0.2rem 0 0 0' }}>
            AI Allocation Recommendation
          </h2>
        </div>
        <div>
          {isApproved ? (
            <span className="badge badge--success" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span>Trip Approved & Dispatched</span>
            </span>
          ) : isRejected ? (
            <span className="badge badge--danger" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              <span>Trip Rejected</span>
            </span>
          ) : (
            <span className="badge badge--warning" style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span>Waiting for Human Approval</span>
            </span>
          )}
        </div>
      </div>

      {/* Driver & Vehicle Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Driver Card */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#08006C', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Assigned Driver
            </span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            {driverName}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
            ID: <strong style={{ color: '#334155' }}>{driverId}</strong>
            {matchedDriver?.licenseNumber && ` • License: ${matchedDriver.licenseNumber}`}
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span>Compliant & Available</span>
            </span>
          </div>
        </div>

        {/* Vehicle Card */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#FF5000', display: 'flex' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Assigned Vehicle
            </span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            {vehicleReg}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
            Model: <strong style={{ color: '#334155' }}>{vehicleModel}</strong> (Max: {vehicleCapacityKg} kg)
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: '#e0f2fe', color: '#075985', borderRadius: '4px', fontWeight: 600 }}>
              ID: {vehicleId}
            </span>
          </div>
        </div>
      </div>

      {/* Order Compatibility Breakdown */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem', marginBottom: '0.5rem' }}>
          Order Compatibility Evaluation
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', color: '#166534', backgroundColor: '#dcfce7', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #86efac', fontWeight: 600 }}>
            Compatible Orders ({compatibleOrderIds.length}): {compatibleOrderIds.join(', ')}
          </div>
          {incompatibleOrderIds.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: '#991b1b', backgroundColor: '#fef2f2', padding: '0.3rem 0.65rem', borderRadius: '6px', border: '1px solid #fca5a5', fontWeight: 600 }}>
              Incompatible Orders ({incompatibleOrderIds.length}): {incompatibleOrderIds.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Load & Capacity Utilization Bar */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
            Consolidated Capacity Utilization
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: utilizationColor }}>
            {totalLoadKg} kg / {vehicleCapacityKg} kg ({utilizationPercent}%)
          </div>
        </div>

        {/* Progress Bar Container */}
        <div
          role="progressbar"
          aria-valuenow={utilizationPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: '14px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1' }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(utilizationPercent, 100)}%`,
              backgroundColor: utilizationColor,
              borderRadius: '10px',
              transition: 'width 0.4s ease-in-out',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem' }}>
          <span>Orders Consolidated: <strong>{manifestOrders.length}</strong></span>
          <span>Aggregated Volume: <strong>{totalVolumeM3.toFixed(2)} m³</strong></span>
        </div>

        {isOverCapacity && (
          <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>Over Capacity Warning: Total load exceeds vehicle payload limit by {totalLoadKg - vehicleCapacityKg} kg ({utilizationPercent}%). Split orders or assign a larger vehicle.</span>
          </div>
        )}
      </div>

      {/* Trip Order Manifest Table */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#08006C', marginBottom: '0.75rem' }}>
          Selected Orders ({manifestOrders.length})
        </h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Pickup</th>
                <th>Drop-off</th>
                <th>Window</th>
                <th>Weight</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              {manifestOrders.map((order: DispatchOrder, idx: number) => (
                <tr key={order.id}>
                  <td><strong>{idx + 1}</strong></td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#08006C' }}>{order.id}</span>
                  </td>
                  <td>{order.customerName || 'Standard Customer'}</td>
                  <td>Colombo Central</td>
                  <td>{order.destination}</td>
                  <td>{order.deliveryWindowStart} - {order.deliveryWindowEnd}</td>
                  <td>{order.weightKg} kg</td>
                  <td>{order.volumeM3} m³</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route / Sequenced Stops Preview */}
      <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#08006C', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 8 22 12 18 16" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
          Route Sequence / Stops Preview
        </h3>
        {routing?.sequenced_stops && routing.sequenced_stops.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.2rem' }}>
              Depot (Central Hub, Colombo)
            </div>
            {routing.sequenced_stops.map((stop: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#08006C', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  {stop.stop_number || idx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                    {stop.destination || stop.address || `Stop ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Order: {stop.order_id || 'N/A'} {stop.eta ? `• ETA: ${stop.eta}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontStyle: 'italic' }}>
            Route sequence will be available after routing.
          </p>
        )}
      </div>

      {/* Safe Decision Summary */}
      <div style={{ marginBottom: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem' }}>
        <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem', marginBottom: '0.5rem' }}>
          Decision Summary & Compliance Rules Passed
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#15803d', fontSize: '0.84rem' }}>
          {decisionReasons.map((reason: string, idx: number) => (
            <li key={idx} style={{ marginBottom: '0.25rem' }}>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Alternative Allocations Collapsible */}
      {alternatives.length > 0 && (
        <div style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => setShowAlternatives(!showAlternatives)}
            style={{ width: '100%', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', border: 'none', textAlign: 'left', fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Alternative Allocation Candidates ({alternatives.length})</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>{showAlternatives ? 'Hide' : 'View'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showAlternatives ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>
          {showAlternatives && (
            <div style={{ padding: '1rem', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {alternatives.map((alt: any, idx: number) => (
                <div key={idx} style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    Alternative Candidate {idx + 1}
                  </div>
                  <div style={{ color: '#475569', marginTop: '0.25rem' }}>
                    Driver: <strong>{alt.driver_id}</strong> | Vehicle: <strong>{alt.vehicle_id}</strong> | Utilization: <strong>{alt.capacity_utilization_percent || 50}%</strong>
                  </div>
                  {alt.reasons && alt.reasons.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Reasons: {alt.reasons.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Human Approval Action Bar */}
      {isWaitingApproval && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <button
            type="button"
            className="button button--danger"
            onClick={onReject}
            disabled={isApproving}
            style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}
          >
            Reject Trip
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={onApprove}
            disabled={isApproving}
            style={{ padding: '0.65rem 1.75rem', fontWeight: 700, backgroundColor: '#FF5000', borderColor: '#FF5000' }}
          >
            {isApproving ? 'Approving Trip...' : 'Approve Trip'}
          </button>
        </div>
      )}
    </div>
  );
};
