import React, { useState } from 'react';
import { useGetShipmentsQuery, useGetTrackingQuery } from '../deliveryApi';
import { TrackingTimeline } from './TrackingTimeline';
import { TrackingMap } from './TrackingMap';
import { ProofOfDeliveryViewer } from './ProofOfDeliveryViewer';

const ShipmentDetail: React.FC<{ id: string }> = ({ id }) => {
    const { data: tracking, isLoading, isError } = useGetTrackingQuery(id);
    if (isLoading) return <p className="admin-muted">Loading tracking…</p>;
    if (isError || !tracking) return <p className="admin-error">Couldn’t load tracking.</p>;

    return (
        <div className="wf-panel">
            <div className="wf-panel__head">
                <h3>{tracking.shipmentCode}</h3>
                <span className={`wf-badge wf-badge--${tracking.status}`}>{tracking.status}</span>
            </div>

            <h4 className="ship-subhead">Route sketch</h4>
            <p className="admin-muted" style={{ fontSize: '0.8rem', margin: '0 0 0.5rem' }}>
                Relative stop positions &amp; visiting order (not a geographic map).
            </p>
            <TrackingMap stops={tracking.stops} />

            <h4 className="ship-subhead">Timeline</h4>
            <TrackingTimeline stops={tracking.stops} />

            <h4 className="ship-subhead">Proof of delivery</h4>
            <ProofOfDeliveryViewer stops={tracking.stops} />
        </div>
    );
};

export const ShipmentsSection: React.FC = () => {
    const { data: shipments = [], isLoading, isError } = useGetShipmentsQuery();
    const [selected, setSelected] = useState<string | null>(null);

    if (isLoading) return <p className="admin-muted">Loading shipments…</p>;
    if (isError) return <p className="admin-error">Couldn’t load shipments. Is the API running?</p>;
    if (shipments.length === 0) {
        return <p className="admin-muted">No shipments yet — approve a workflow to dispatch one.</p>;
    }

    return (
        <div>
            <table className="wf-table wf-table--clickable">
                <thead>
                    <tr><th>Shipment</th><th>Status</th><th>Progress</th><th>Distance</th><th>Dispatched</th></tr>
                </thead>
                <tbody>
                    {shipments.map((s) => (
                        <tr key={s.id} className={selected === s.id ? 'is-active' : ''} onClick={() => setSelected(s.id)}>
                            <td>{s.shipmentCode}</td>
                            <td><span className={`wf-badge wf-badge--${s.status}`}>{s.status}</span></td>
                            <td>{s.deliveredCount}/{s.stopCount}</td>
                            <td>{s.totalDistanceKm.toFixed(1)} km</td>
                            <td>{s.dispatchedAt ? new Date(s.dispatchedAt).toLocaleString() : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selected && (
                <div className="wf-detail" style={{ marginTop: '1.5rem' }}>
                    <ShipmentDetail id={selected} />
                </div>
            )}
        </div>
    );
};
