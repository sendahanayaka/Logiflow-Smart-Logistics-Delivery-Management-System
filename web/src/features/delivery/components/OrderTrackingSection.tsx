// [S4]  customer-facing live delivery tracking for one order (polls every 5s).
import React from 'react';
import { useGetOrderTrackingQuery } from '../deliveryApi';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

const STOP_LABEL: Record<string, string> = {
  Pending: 'Not started yet',
  EnRoute: 'Driver on the way',
  Arrived: 'Driver has arrived',
  Delivered: 'Delivered',
  Skipped: 'Could not deliver',
};

export const OrderTrackingSection: React.FC<{ orderId: string }> = ({ orderId }) => {
  const { data, isLoading } = useGetOrderTrackingQuery(orderId, { pollingInterval: 5000 });

  const wrap: React.CSSProperties = {
    background: 'linear-gradient(135deg,#eef2ff 0%,#f8fafc 100%)',
    padding: '2rem 2.5rem', borderTop: '1px solid #e2e8f0',
  };
  const h3: React.CSSProperties = { margin: '0 0 1rem 0', color: '#08006C', fontSize: '1.25rem' };

  if (isLoading || !data) {
    return <div style={wrap}><h3 style={h3}>Delivery Tracking</h3><p style={{ color: '#94a3b8' }}>Loading…</p></div>;
  }

  if (!data.hasShipment) {
    const msg = data.stage === 'AwaitingDispatch'
      ? '🗺️ Route planned — awaiting dispatch approval. Your driver will be assigned shortly.'
      : '📦 Your order is being prepared at the warehouse. Tracking appears once it’s dispatched.';
    return <div style={wrap}><h3 style={h3}>Delivery Tracking</h3><p style={{ color: '#475569', margin: 0 }}>{msg}</p></div>;
  }

  const delivered = data.stopStatus === 'Delivered';
  const badgeColor = delivered ? '#1B7A43' : data.stopStatus === 'Arrived' ? '#B4530A' : '#1D4ED8';

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3 style={h3}>Delivery Tracking</h3>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>live · updates every 5s</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.5rem' }}>
        <div>
          <h4 style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>Shipment</h4>
          <p style={{ margin: '0 0 0.3rem', fontWeight: 700, color: '#0f172a' }}>{data.shipmentCode}</p>
          <span style={{ background: badgeColor, color: '#fff', borderRadius: 999, padding: '0.2rem 0.7rem', fontSize: '0.75rem', fontWeight: 700 }}>
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
            {delivered ? 'Delivered' : 'Estimated Arrival'}
          </h4>
          {delivered ? (
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
    </div>
  );
};

export default OrderTrackingSection;
