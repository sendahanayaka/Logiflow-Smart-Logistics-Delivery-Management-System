// [S4]  driver portal — the signed-in driver's assigned runs.
import React from 'react';
import '../Portal.css';
import '../../delivery/driver.css';
import { useGetMyRunsQuery } from '../../delivery/deliveryApi';
import { DriverRunCard } from '../../delivery/components/DriverRunCard';

export const DriverPortalPage: React.FC = () => {
    const { data: runs = [], isLoading, isError, refetch } = useGetMyRunsQuery();

    return (
        <div className="portal-container">
            <header className="portal-header">
                <span className="portal-role-badge">DRIVER</span>
                <h1>My Runs</h1>
                <p>Your assigned delivery runs. Open a run to update stops and capture proof of delivery.</p>
            </header>

            {isLoading ? (
                <div className="driver-state">Loading your runs…</div>
            ) : isError ? (
                <div className="driver-state driver-state--error">
                    Couldn’t load your runs. Is the API running?
                    <div style={{ marginTop: '1rem' }}>
                        <button type="button" className="run-card__open" onClick={() => refetch()}>
                            Retry
                        </button>
                    </div>
                </div>
            ) : runs.length === 0 ? (
                <div className="driver-state">
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-navy, #08006C)' }}>No runs assigned</h3>
                    <p style={{ margin: 0 }}>
                        You have no delivery runs assigned yet. Once dispatch assigns you a shipment, it will appear here.
                    </p>
                </div>
            ) : (
                <>
                    <p className="driver-hint">{runs.length} run{runs.length === 1 ? '' : 's'} assigned to you.</p>
                    <div className="driver-runs">
                        {runs.map((run) => (
                            <DriverRunCard key={run.id} run={run} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default DriverPortalPage;
