// [S4]  customer-facing live delivery tracking for one order (polls every 5s).
import React from 'react';
import { useGetOrderTrackingQuery } from '../deliveryApi';
import { OrderStatusTimeline } from '../../orders/components/OrderStatusTimeline';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

const STOP_LABEL: Record<string, string> = {
  Pending: 'Driver assigned',
  EnRoute: 'Driver on the way',
  Arrived: 'Driver has arrived',
  Delivered: 'Delivered',
  Skipped: 'Could not deliver',
};

// Map the live tracking to the timeline stage index (0..5):
// 0 Order Created · 1 Delivery Planning · 2 Driver Assigned · 3 Picked Up · 4 In Transit · 5 Delivered
const toActiveStep = (hasShipment: boolean, stopStatus: string | null): number => {
  if (!hasShipment) return 1;
  switch (stopStatus) {
    case 'Delivered': return 5;
    case 'Arrived': return 4;
    case 'EnRoute': return 3;
    default: return 2; // Pending → Driver Assigned
  }
};

export const OrderTrackingSection: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { data, isLoading } = useGetOrderTrackingQuery(orderId, { pollingInterval: 5000 });

  const wrap: React.CSSProperties = {
    background: 'linear-gradient(135deg,#eef2ff 0%,#f8fafc 100%)',
    padding: '2rem 2.5rem', borderTop: '1px solid #e2e8f0',
  };
  const h3: React.CSSProperties = { margin: '0 0 1rem 0', color: '#08006C', fontSize: '1.25rem' };

  const activeStep = data ? toActiveStep(data.hasShipment, data.stopStatus) : 1;
  const delivered = data?.stopStatus === 'Delivered';

  return (
    <>
      {delivered && (
        <div style={{
          background: 'linear-gradient(135deg,#1B7A43 0%,#0d9488 100%)', color: '#fff',
          padding: '1.25rem 2.5rem', textAlign: 'center',
        }}>
          <strong style={{ fontSize: '1.15rem' }}>🎉 Delivered — thanks for your order!</strong>
          <p style={{ margin: '0.35rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Your package was delivered{data?.receivedByName ? ` to ${data.receivedByName}` : ''}
            {data?.deliveredAt ? ` on ${fmt(data.deliveredAt)}` : ''}.
          </p>
        </div>
      )}

      <div style={{ borderBottom: '1px solid #e2e8f0' }}>
        <OrderStatusTimeline status="active" activeStep={activeStep} />
      </div>

      <div style={wrap}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={h3}>Delivery Tracking</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>live · updates every 5s</span>
        </div>

        {isLoading || !data ? (
          <p style={{ color: '#94a3b8', margin: 0 }}>Loading…</p>
        ) : !data.hasShipment ? (
          <p style={{ color: '#475569', margin: 0 }}>
            {data.stage === 'AwaitingDispatch'
              ? '🗺️ Route planned — awaiting dispatch approval. Your driver will be assigned shortly.'
              : '📦 Your order is being prepared at the warehouse. Tracking appears once it’s dispatched.'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>Shipment</h4>
              <p style={{ margin: '0 0 0.3rem', fontWeight: 700, color: '#0f172a' }}>{data.shipmentCode}</p>
              <span style={{
                background: data.stopStatus === 'Delivered' ? '#1B7A43' : data.stopStatus === 'Arrived' ? '#B4530A' : '#1D4ED8',
                color: '#fff', borderRadius: 999, padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 700,
              }}>
                {STOP_LABEL[data.stopStatus ?? ''] ?? data.shipmentStatus}
              </span>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>Your Driver</h4>
              <p style={{ margin: '0 0 0.25rem', color: '#0f172a' }}>{data.driverName ?? 'Assigning…'}</p>
              {data.driverContact && (
                <a href={`tel:${data.driverContact}`} style={{ color: '#FD5901', fontWeight: 600, textDecoration: 'none' }}>📞 {data.driverContact}</a>
              )}
              {data.vehicleRegistration && (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: '#475569' }}>Vehicle: {data.vehicleRegistration}</p>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>
                {data.stopStatus === 'Delivered' ? 'Delivered' : 'Estimated Arrival'}
              </h4>
              {data.stopStatus === 'Delivered' ? (
                <>
                  <p style={{ margin: '0 0 0.25rem', color: '#0f172a' }}>{fmt(data.deliveredAt)}</p>
                  {data.receivedByName && <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>Received by {data.receivedByName}</p>}
                </>
              ) : (
                <>
                  <p style={{ margin: '0 0 0.25rem', color: '#0f172a' }}>{fmt(data.eta)}</p>
                  {data.onTime !== null && (
                    <span style={{ fontSize: '0.8rem', color: data.onTime ? '#1B7A43' : '#B02A24', fontWeight: 600 }}>
                      {data.onTime ? 'On schedule' : 'Running behind'}
                    </span>
                  )}
                  {data.arrivedAt && <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: '#475569' }}>Driver arrived {fmt(data.arrivedAt)}</p>}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderTrackingSection;
