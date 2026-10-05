import React, { useState } from 'react';
import { useGetWorkflowsQuery } from '../deliveryApi';
import { ApprovalPanel } from './ApprovalPanel';

export const WorkflowMonitor: React.FC = () => {
    const { data: workflows = [], isLoading, isError } = useGetWorkflowsQuery();
    const [selected, setSelected] = useState<string | null>(null);

    if (isLoading) return <p className="admin-muted">Loading workflows…</p>;
    if (isError) return <p className="admin-error">Couldn’t load workflows. Is the API running?</p>;
    if (workflows.length === 0) {
        return <p className="admin-muted">No agent workflows yet — trigger a routing run and it appears here.</p>;
    }

    return (
        <div>
            <table className="wf-table wf-table--clickable">
                <thead>
                    <tr><th>Workflow</th><th>Status</th><th>Stops</th><th>Created</th></tr>
                </thead>
                <tbody>
                    {workflows.map((w) => (
                        <tr key={w.id} className={selected === w.id ? 'is-active' : ''} onClick={() => setSelected(w.id)}>
                            <td>{w.workflowKey}</td>
                            <td><span className={`wf-badge wf-badge--${w.status}`}>{w.status}</span></td>
                            <td>{w.stopCount}</td>
                            <td>{new Date(w.createdAt).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selected && (
                <div className="wf-detail" style={{ marginTop: '1.5rem' }}>
                    <ApprovalPanel workflowId={selected} readOnly />
                </div>
            )}
        </div>
    );
};
