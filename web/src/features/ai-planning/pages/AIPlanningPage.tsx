import React, { useState } from 'react';
import './AIPlanningPage.css';

interface PlanStep {
    step: string;
    agent: string;
    description: string;
}

interface TriageProposal {
    workflow_id: string;
    validated_order_ids: string[];
    priority_class: string;
    special_handling_flags: string[];
    plan: PlanStep[];
    ambiguities: string[];
}

interface AgentResponse {
    workflow_id: string;
    status: string;
    proposal?: {
        triage?: TriageProposal;
    };
}

export const AIPlanningPage: React.FC = () => {
    const [workflowId, setWorkflowId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AgentResponse | null>(null);

    const fetchExistingPlan = async () => {
        if (!workflowId.trim()) return;
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const res = await fetch(`/agent-api/workflow/${workflowId}`);
            if (!res.ok) {
                throw new Error('Unable to generate delivery plan.');
            }

            const json = await res.json();

            setData({
                workflow_id: workflowId,
                status: json.status || 'PLANNING',
                proposal: {
                    triage: json.triage
                }
            });
        } catch (err: any) {
            setError(err.message || 'Unable to generate delivery plan.');
        } finally {
            setLoading(false);
        }
    };

    const manuallyTriggerPlan = async () => {
        if (!workflowId.trim()) return;
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const reqPayload = {
                payload: {
                    workflow_id: workflowId,
                    order_ids: [workflowId],
                    objective: 'Delivery',
                    pickup_address: 'Warehouse',
                    delivery_addresses: ['Customer'],
                    requested_priority: 'STANDARD',
                    packages: []
                }
            };

            const res = await fetch(`/agent-api/workflow/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reqPayload)
            });

            if (!res.ok) {
                throw new Error('Unable to generate delivery plan.');
            }

            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message || 'Unable to generate delivery plan.');
        } finally {
            setLoading(false);
        }
    };

    const renderWorkflowVisual = () => (
        <div className="workflow-visual">
            <div className="wf-node">Customer Order</div>
            <div className="wf-arrow">↓</div>
            <div className="wf-node highlighted">Delivery Planning Agent</div>
            <div className="wf-arrow">↓</div>
            <div className="wf-node">Resource Allocation</div>
            <div className="wf-arrow">↓</div>
            <div className="wf-node">Validation</div>
            <div className="wf-arrow">↓</div>
            <div className="wf-node">Route Optimization</div>
            <div className="wf-arrow">↓</div>
            <div className="wf-node">Human Approval</div>
            <div className="wf-arrow">↓</div>
            <div className="wf-node">Execution</div>
        </div>
    );

    const triage = data?.proposal?.triage;

    return (
        <div className="ai-planning-container">
            <div className="ai-planning-header">
                <h1>🤖 AI Delivery Planning</h1>
                <p>Enter an order to view its AI Delivery Planning Result.</p>
            </div>

            <div className="input-section card">
                <div className="input-group">
                    <label htmlFor="workflow-id">Order / Workflow ID</label>
                    <input
                        id="workflow-id"
                        value={workflowId}
                        onChange={(e) => setWorkflowId(e.target.value)}
                        placeholder="e.g. wf-12345"
                    />
                </div>
                <div className="action-buttons">
                    <button className="btn-primary" onClick={fetchExistingPlan} disabled={loading || !workflowId}>
                        Fetch Generated Plan
                    </button>
                    <button className="btn-secondary" onClick={manuallyTriggerPlan} disabled={loading || !workflowId}>
                        Manually Trigger AI
                    </button>
                </div>
            </div>

            {loading && (
                <div className="loading-state card">
                    <p>AI is generating the delivery plan...</p>
                </div>
            )}

            {error && (
                <div className="error-state card">
                    <p>{error}</p>
                </div>
            )}

            {triage && !loading && !error && (
                <div className="results-wrapper">
                    <div className="results-header">
                        <h2>🤖 AI DELIVERY PLANNING RESULT</h2>
                    </div>

                    <div className="results-grid">
                        {/* Left Column: Analysis & Estimates */}
                        <div className="results-column">
                            <div className="dashboard-card">
                                <h3>ORDER ANALYSIS</h3>
                                <div className="result-field">
                                    <strong>Package Volume</strong>
                                    <span className="pending-text">[Calculated later]</span>
                                </div>
                                <div className="result-field">
                                    <strong>Weight Classification</strong>
                                    <span className="pending-text">[Calculated later]</span>
                                </div>
                                <div className="result-field" data-testid="handling-requirement">
                                    <strong>Handling Requirement</strong>
                                    <span>{triage.special_handling_flags?.length ? triage.special_handling_flags.join(', ') : 'None'}</span>
                                </div>
                            </div>

                            <div className="dashboard-card" data-testid="vehicle-recommendation">
                                <h3>VEHICLE RECOMMENDATION</h3>
                                <div className="result-field">
                                    <strong>Recommended Vehicle</strong>
                                    <span className="pending-text">[Available after integration/calculation]</span>
                                </div>
                                <div className="result-field">
                                    <strong>Vehicle Reason</strong>
                                    <span className="pending-text">[Available after integration/calculation]</span>
                                </div>
                            </div>

                            <div className="dashboard-card" data-testid="delivery-estimate">
                                <h3>DELIVERY ESTIMATE</h3>
                                <div className="result-field">
                                    <strong>Estimated Delivery Distance</strong>
                                    <span className="pending-text">[Pending calculation/integration]</span>
                                </div>
                                <div className="result-field">
                                    <strong>Estimated Delivery Time</strong>
                                    <span className="pending-text">[Pending calculation/integration]</span>
                                </div>
                                <div className="result-field">
                                    <strong>Estimated Delivery Cost</strong>
                                    <span className="pending-text">[Pending calculation/integration]</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: AI Outputs & Visuals */}
                        <div className="results-column">
                            <div className="dashboard-card" data-testid="handling-risk">
                                <h3>HANDLING & RISK</h3>
                                <div className="result-field">
                                    <strong>Special Handling</strong>
                                    <span>{triage.special_handling_flags?.length ? triage.special_handling_flags.join(', ') : 'None'}</span>
                                </div>
                                <div className="result-field">
                                    <strong>Priority Recommendation</strong>
                                    <span className={`badge priority-${triage.priority_class?.toLowerCase() || 'standard'}`}>
                                        {triage.priority_class}
                                    </span>
                                </div>

                                {triage.ambiguities && triage.ambiguities.length > 0 ? (
                                    <div className="ambiguities-section">
                                        <strong>Risk / Ambiguity</strong>
                                        <ul>
                                            {triage.ambiguities.map((amb, i) => (
                                                <li key={i}>{amb}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="result-field" style={{ marginTop: '0.8rem' }}>
                                        <strong>Risk / Ambiguity</strong>
                                        <span>No ambiguities detected</span>
                                    </div>
                                )}
                            </div>

                            <div className="dashboard-card" data-testid="ai-planning-recommendation">
                                <h3>AI PLANNING RECOMMENDATION</h3>
                                <div className="planning-steps">
                                    <div className="steps-list">
                                        {triage.plan?.map((step, idx) => (
                                            <div className="step-item" key={idx}>
                                                <div className="step-number">{idx + 1}</div>
                                                <div className="step-content">
                                                    <div className="step-agent">{step.agent}</div>
                                                    <div className="step-desc">{step.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-card visualization-card">
                                <h3>WORKFLOW</h3>
                                {renderWorkflowVisual()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
