// [warehouse]  staff dashboard: warehouses + quick actions + the dispatch flow.
import React from 'react';
import { Link } from 'react-router-dom';
import '../Portal.css';
import { useGetWarehousesQuery } from '../../warehouse/warehouseApi';

export const WarehousePortalPage: React.FC = () => {
    const { data: warehouses = [], isLoading, isError } = useGetWarehousesQuery();

    return (
        <div className="portal-container">
            <header className="portal-header fade-in-up">
                <span className="portal-role-badge">STAFF DASHBOARD</span>
                <h1>Warehouse Operations</h1>
                <div className="portal-divider"></div>
                <p>Seamlessly receive packages, intelligently build capacity-checked batches, and coordinate routing.</p>
            </header>

            <div className="portal-workflow fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="workflow-step">
                    <span className="step-num">01</span>
                    <div className="step-text">
                        <h4>Intake</h4>
                        <p>Receive shipments into a designated storage zone.</p>
                    </div>
                </div>
                <div className="workflow-step">
                    <span className="step-num">02</span>
                    <div className="step-text">
                        <h4>Dispatch</h4>
                        <p>Group packages, execute capacity checks, and finalize batches.</p>
                    </div>
                </div>
                <div className="workflow-step">
                    <span className="step-num">03</span>
                    <div className="step-text">
                        <h4>Routing</h4>
                        <p>Deploy AI routing algorithms & forward to ops-manager.</p>
                    </div>
                </div>
            </div>

            <section className="portal-main-content fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="section-header-inline">
                    <h2>Active Warehouses</h2>
                    <Link className="btn-primary-outline" to="/warehouse/manage">Manage Locations</Link>
                </div>

                {isLoading ? (
                    <div className="loading-state">
                        <span className="spinner"></span>
                        <p>Synchronizing Global Warehouses...</p>
                    </div>
                ) : isError ? (
                    <div className="error-state">
                        <p>Connection disrupted. Please verify network access to the API.</p>
                    </div>
                ) : warehouses.length === 0 ? (
                    <div className="portal-dashboard-placeholder">
                        <span className="placeholder-icon">🏢</span>
                        <h3>No Active Facilities</h3>
                        <p>Create your first warehouse branch to commence global logistics routing and intake operations.</p>
                        <Link className="btn-primary" to="/warehouse/manage">Configure Workspace</Link>
                    </div>
                ) : (
                    <div className="warehouse-grid">
                        {warehouses.map((w, idx) => (
                            <article key={w.id} className="warehouse-card fade-in-up" style={{ animationDelay: `${250 + (idx * 50)}ms` }}>
                                <div className="card-header">
                                    <div className="card-icon">📍</div>
                                    <h3>{w.name}</h3>
                                </div>
                                <div className="card-status">
                                    <span className="status-indicator active"></span> Operational Node
                                </div>
                                <div className="card-actions">
                                    <Link className="action-btn" to={`/warehouse/${w.id}`}>Overview</Link>
                                    <Link className="action-btn outline" to={`/warehouse/${w.id}/intake`}>Intake</Link>
                                    <Link className="action-btn outline" to={`/warehouse/${w.id}/dispatch`}>Dispatch</Link>
                                    <Link className="action-btn outline" to={`/warehouse/${w.id}/inventory`}>Inventory</Link>
                                </div>
                                <div className="card-footer">
                                    <Link className="throughput-link" to={`/warehouse/${w.id}/throughput`}>View Operations Throughput →</Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default WarehousePortalPage;
