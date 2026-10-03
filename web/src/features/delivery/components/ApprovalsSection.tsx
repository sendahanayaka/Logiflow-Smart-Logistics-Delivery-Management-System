import React, { useState } from 'react';
import { useGetWorkflowsQuery } from '../deliveryApi';
import { ApprovalPanel } from './ApprovalPanel';

export const ApprovalsSection: React.FC = () => {
    const { data: workflows = [], isLoading, isError } = useGetWorkflowsQuery({ status: 'AwaitingApproval' });
    const [selected, setSelected] = useState<string | null>(null);

    if (isLoading) return <p className="admin-muted">Loading approval queue…</p>;
    if (isError) return <p className="admin-error">Couldn’t load the approval queue. Is the API running?</p>;
    if (workflows.length === 0) return <p className="admin-muted">Nothing awaiting approval right now. 🎉</p>;

    const current = workflows.find((w) => w.id === selected) ? selected! : workflows[0].id;

    return (
        <div className="wf-split">
            <ul className="wf-queue">
                {workflows.map((w) => (
                    <li key={w.id}>
                        <button
                            className={`wf-queue__item ${current === w.id ? 'is-active' : ''}`}
                            onClick={() => setSelected(w.id)}
                        >
                            <strong>{w.workflowKey}</strong>
                            <span>{w.stopCount} stop(s)</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="wf-detail">
                <ApprovalPanel workflowId={current} />
            </div>
        </div>
    );
};
