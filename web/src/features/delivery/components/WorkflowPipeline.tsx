import React from 'react';

// The agent pipeline the ops manager watches: Plan -> Allocate -> Validate -> Route
// -> Human approval -> Execute. Our backend WorkflowStatus collapses the agent's
// internal steps, so once a workflow reaches AwaitingApproval the plan stages are done.
const STAGES = ['Plan', 'Allocate', 'Validate', 'Route', 'Approval', 'Execute'] as const;

type StageState = 'done' | 'current' | 'pending' | 'rejected';

function stageStates(status: string): StageState[] {
    switch (status) {
        case 'Pending':
        case 'Planning':
            return ['current', 'pending', 'pending', 'pending', 'pending', 'pending'];
        case 'AwaitingApproval':
            return ['done', 'done', 'done', 'done', 'current', 'pending'];
        case 'Approved':
            return ['done', 'done', 'done', 'done', 'done', 'current'];
        case 'Completed':
            return ['done', 'done', 'done', 'done', 'done', 'done'];
        case 'Rejected':
            return ['done', 'done', 'done', 'done', 'rejected', 'pending'];
        default:
            return ['pending', 'pending', 'pending', 'pending', 'pending', 'pending'];
    }
}

export const WorkflowPipeline: React.FC<{ status: string }> = ({ status }) => {
    if (status === 'Failed') {
        return <div className="wf-pipeline wf-pipeline--failed">⚠ Safe-failure — flagged for manual handling.</div>;
    }

    const states = stageStates(status);
    return (
        <div className="wf-pipeline" role="list" aria-label="agent workflow pipeline">
            {STAGES.map((stage, i) => (
                <React.Fragment key={stage}>
                    {i > 0 && <span className={`wf-connector wf-connector--${states[i - 1]}`} />}
                    <span className={`wf-stage wf-stage--${states[i]}`} role="listitem">
                        <span className="wf-stage__dot" />
                        {stage}
                    </span>
                </React.Fragment>
            ))}
        </div>
    );
};
