// [warehouse]  staff dashboard: warehouses + quick actions + the dispatch flow.
import React from 'react';
import { Link } from 'react-router-dom';
import '../Portal.css';
import { useGetWarehousesQuery } from '../../warehouse/warehouseApi';

export const WarehousePortalPage: React.FC = () => {
    const { data: warehouses = [], isLoading, isError } = useGetWarehousesQuery();

    return (
        <div className="portal-container">
            <header className="portal-header">
                <span className="portal-role-badge">WAREHOUSE_STAFF</span>
                <h1>Warehouse Operations</h1>
                <p>Receive packages, build capacity-checked dispatch batches, and send routes to ops for approval.</p>
            </header>

            <ol style={{ color: '#4B5563', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                <li><strong>Intake</strong> — receive a customer's packages into a storage zone.</li>
                <li><strong>Dispatch</strong> — group available packages into a batch, validate capacity/compatibility.</li>
                <li><strong>Plan route &amp; send to ops</strong> — hand the batch to the routing agent; it appears in the ops-manager approval queue.</li>
            </ol>

            {isLoading ? (
                <p style={{ color: '#6B7280' }}>Loading warehouses…</p>
            ) : isError ? (
                <p style={{ color: '#B02A24' }}>Couldn’t load warehouses. Is the API running?</p>
            ) : warehouses.length === 0 ? (
                <div className="portal-dashboard-placeholder">
                    <h3>No warehouses yet</h3>
                    <p>Create your first warehouse to start receiving and dispatching packages.</p>
                    <Link className="btn-primary" to="/warehouse/manage" style={{ display: 'inline-block', marginTop: '1rem' }}>
                        Open warehouse workspace
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {warehouses.map((w) => (
                        <article key={w.id} style={{
                            background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10,
                            padding: '1.25rem', boxShadow: '0 4px 6px rgba(0,0,0,0.03)',
                        }}>
                            <h3 style={{ color: 'var(--color-navy, #08006C)', margin: '0 0 0.75rem' }}>{w.name}</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <Link className="btn-login" to={`/warehouse/${w.id}`}>Overview</Link>
                                <Link className="btn-login" to={`/warehouse/${w.id}/intake`}>Intake</Link>
                                <Link className="btn-login" to={`/warehouse/${w.id}/dispatch`}>Dispatch</Link>
                                <Link className="btn-login" to={`/warehouse/${w.id}/inventory`}>Inventory</Link>
                                <Link className="btn-login" to={`/warehouse/${w.id}/throughput`}>Throughput</Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <p style={{ marginTop: '1.5rem' }}>
                <Link className="btn-primary" to="/warehouse/manage">Manage all warehouses →</Link>
            </p>
        </div>
    );
};

export default WarehousePortalPage;
