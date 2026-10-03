// [S4]  customer live-tracking page (track by shipment code)
import React, { useState } from 'react';
import '../../portals/Portal.css';
import '../../portals/AdminDashboard.css';
import '../delivery.css';
import { useLazyGetTrackingByCodeQuery } from '../deliveryApi';
import { TrackingMap } from '../components/TrackingMap';
import { TrackingTimeline } from '../components/TrackingTimeline';
import { ProofOfDeliveryViewer } from '../components/ProofOfDeliveryViewer';

export const TrackingPage: React.FC = () => {
    const [code, setCode] = useState('');
    const [searched, setSearched] = useState(false);
    const [trigger, { data: tracking, isFetching, isError, error }] = useLazyGetTrackingByCodeQuery();

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;
        setSearched(true);
        trigger(code.trim());
    };

    const notFound = isError && (error as any)?.status === 404;

    return (
        <div className="portal-container">
            <header className="portal-header">
                <span className="portal-role-badge">TRACK</span>
                <h1>Track your delivery</h1>
                <p>Enter your shipment code (e.g. SHP-XXXXXXXX) to see live status and ETAs.</p>
            </header>

            <form className="track-form" onSubmit={submit}>
                <input
                    placeholder="Shipment code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    aria-label="Shipment code"
                />
                <button className="admin-btn" type="submit" disabled={isFetching}>
                    {isFetching ? 'Tracking…' : 'Track'}
                </button>
            </form>

            {searched && !isFetching && notFound && (
                <p className="admin-error">No shipment found for that code.</p>
            )}
            {searched && !isFetching && isError && !notFound && (
                <p className="admin-error">Couldn’t load tracking — please try again.</p>
            )}

            {tracking && !isFetching && (
                <div className="wf-panel" style={{ marginTop: '1.5rem' }}>
                    <div className="wf-panel__head">
                        <h3>{tracking.shipmentCode}</h3>
                        <span className={`wf-badge wf-badge--${tracking.status}`}>{tracking.status}</span>
                    </div>
                    <h4 className="ship-subhead">Route</h4>
                    <TrackingMap stops={tracking.stops} />
                    <h4 className="ship-subhead">Timeline</h4>
                    <TrackingTimeline stops={tracking.stops} />
                    <h4 className="ship-subhead">Proof of delivery</h4>
                    <ProofOfDeliveryViewer stops={tracking.stops} />
                </div>
            )}
        </div>
    );
};

export default TrackingPage;
