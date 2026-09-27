import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Portal.css';
import '../AdminDashboard.css';
import '../../delivery/delivery.css';
import { useGetWorkflowsQuery, useGetShipmentsQuery } from '../../delivery/deliveryApi';
import { ApprovalsSection } from '../../delivery/components/ApprovalsSection';
import { WorkflowMonitor } from '../../delivery/components/WorkflowMonitor';

type TabKey = 'overview' | 'approvals' | 'monitor' | 'shipments' | 'fleet' | 'users';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'monitor', label: 'Agent Monitor' },
    { key: 'shipments', label: 'Shipments' },
    { key: 'fleet', label: 'Fleet' },
    { key: 'users', label: 'Users' },
];

const StatTile: React.FC<{ label: string; value: React.ReactNode; accent?: boolean }> = ({ label, value, accent }) => (
    <div className={`admin-stat ${accent ? 'admin-stat--accent' : ''}`}>
        <span className="admin-stat__value">{value}</span>
        <span className="admin-stat__label">{label}</span>
    </div>
);

const Overview: React.FC = () => {
    const { data: workflows, isLoading: wfLoading, isError: wfError } = useGetWorkflowsQuery();
    const { data: shipments, isLoading: shLoading, isError: shError } = useGetShipmentsQuery();

    if (wfLoading || shLoading) return <p className="admin-muted">Loading dashboard…</p>;
    if (wfError || shError) return <p className="admin-error">Couldn’t load dashboard data. Is the API running?</p>;

    const pendingApprovals = (workflows ?? []).filter((w) => w.status === 'AwaitingApproval').length;
    const totalWorkflows = (workflows ?? []).length;
    const activeShipments = (shipments ?? []).filter((s) => s.status !== 'Delivered' && s.status !== 'Cancelled').length;
    const delivered = (shipments ?? []).filter((s) => s.status === 'Delivered').length;

    return (
        <div className="admin-stats-grid">
            <StatTile label="Pending approvals" value={pendingApprovals} accent />
            <StatTile label="Workflows total" value={totalWorkflows} />
            <StatTile label="Active shipments" value={activeShipments} />
            <StatTile label="Delivered" value={delivered} />
        </div>
    );
};

const ComingSoon: React.FC<{ phase: string; children: React.ReactNode }> = ({ phase, children }) => (
    <div className="portal-dashboard-placeholder">
        <h3>{children}</h3>
        <p>Arrives in {phase}.</p>
    </div>
);

export const AdminPortalPage: React.FC = () => {
    const [tab, setTab] = useState<TabKey>('overview');

    return (
        <div className="portal-container">
            <header className="portal-header">
                <span className="portal-role-badge">ADMIN</span>
                <h1>Operations Dashboard</h1>
                <p>Approve routing plans, monitor the agent workflow, and oversee deliveries.</p>
            </header>

            <nav className="admin-tabs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        className={`admin-tab ${tab === t.key ? 'admin-tab--active' : ''}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </nav>

            <main className="admin-content">
                {tab === 'overview' && <Overview />}
                {tab === 'approvals' && <ApprovalsSection />}
                {tab === 'monitor' && <WorkflowMonitor />}
                {tab === 'shipments' && <ComingSoon phase="Phase 3">Shipments &amp; live tracking</ComingSoon>}
                {tab === 'fleet' && (
                    <div className="admin-link-card">
                        <h3>Fleet &amp; Driver Management</h3>
                        <p>Vehicles, drivers, assignments, duty schedules and maintenance.</p>
                        <Link className="admin-btn" to="/fleet">Open Fleet</Link>
                    </div>
                )}
                {tab === 'users' && (
                    <div className="admin-link-card">
                        <h3>User Management</h3>
                        <p>Manage users and roles.</p>
                        <Link className="admin-btn" to="/users">Open Users</Link>
                    </div>
                )}
            </main>
        </div>
    );
};
