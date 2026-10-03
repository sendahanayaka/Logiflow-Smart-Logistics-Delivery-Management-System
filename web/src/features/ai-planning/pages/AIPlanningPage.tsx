// [S4/ops]  Admin-only view of agent-proposed delivery plans.
// Backend-backed (never calls the internal agent directly from the browser).
import React, { useState } from 'react';
import './AIPlanningPage.css';
import { useGetWorkflowsQuery } from '../../delivery/deliveryApi';
import { ApprovalPanel } from '../../delivery/components/ApprovalPanel';

export const AIPlanningPage: React.FC = () => {
    const { data: workflows = [], isLoading, isError } = useGetWorkflowsQuery();
    const [selected, setSelected] = useState<string>('');

    return (
        <div className="ai-planning-container">
            <div className="ai-planning-header">
                <h1>🤖 AI Delivery Planning</h1>
                <p>Agent-proposed delivery plans. Pick a workflow to review its route, the agent's driver/vehicle allocation, and approve or reject it.</p>
            </div>

            <div className="input-section card">
                <div className="input-group">
                    <label htmlFor="wf-select">Workflow</label>
                    <select id="wf-select" value={selected} onChange={(e) => setSelected(e.target.value)}>
                        <option value="">Select a workflow…</option>
                        {workflows.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.workflowKey} — {w.status} ({w.stopCount} stops)
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {isLoading && (
                <div className="loading-state card"><p>Loading workflows…</p></div>
            )}

            {isError && (
                <div className="error-state card"><p>Couldn’t load workflows. Is the API running?</p></div>
            )}

            {!isLoading && !isError && workflows.length === 0 && (
                <div className="loading-state card">
                    <p>No workflows yet. Trigger one from a warehouse dispatch batch (Plan route &amp; send to ops).</p>
                </div>
            )}

            {selected && (
                <div className="results-wrapper">
                    <ApprovalPanel workflowId={selected} />
                </div>
            )}
        </div>
    );
};
