// [S4]  approve/reject/revise panel + plan review
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../app/store';
import { useGetWorkflowQuery, useApproveWorkflowMutation } from '../deliveryApi';
import { useGetDriversQuery, useGetVehiclesQuery } from '../../fleet/api/fleetApi';
import { WorkflowPipeline } from './WorkflowPipeline';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

export const ApprovalPanel: React.FC<{ workflowId: string; readOnly?: boolean }> = ({ workflowId, readOnly }) => {
    const user = useSelector((s: RootState) => s.auth.user);
    const decidedBy = user?.name || user?.email || 'ops-manager';

    const { data: workflow, isLoading, isError } = useGetWorkflowQuery(workflowId);
    const [approve, { isLoading: acting }] = useApproveWorkflowMutation();
    const { data: drivers = [] } = useGetDriversQuery();
    const { data: vehicles = [] } = useGetVehiclesQuery();

    const [driverId, setDriverId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [reason, setReason] = useState('');
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    // Default the driver/vehicle to the S2 allocation agent's pick; the ops manager
    // can still override before approving.
    useEffect(() => {
        if (workflow?.allocatedDriverId) setDriverId((cur) => cur || workflow.allocatedDriverId!);
        if (workflow?.allocatedVehicleId) setVehicleId((cur) => cur || workflow.allocatedVehicleId!);
    }, [workflow?.allocatedDriverId, workflow?.allocatedVehicleId]);

    if (isLoading) return <p className="admin-muted">Loading plan…</p>;
    if (isError || !workflow) return <p className="admin-error">Couldn’t load this workflow.</p>;

    const canDecide = !readOnly && workflow.status === 'AwaitingApproval';

    const run = async (body: any) => {
        setFeedback(null);
        try {
            const res = await approve({ id: workflowId, body }).unwrap();
            setFeedback({ ok: true, msg: res.message });
        } catch (e: any) {
            setFeedback({ ok: false, msg: e?.data?.message || e?.error || 'Action failed.' });
        }
    };

    const onApprove = () => {
        if (!driverId || !vehicleId) {
            setFeedback({ ok: false, msg: 'Select a driver and a vehicle to approve.' });
            return;
        }
        run({ action: 'APPROVE', decidedBy, driverId, vehicleId });
    };

    return (
        <div className="wf-panel">
            <div className="wf-panel__head">
                <div>
                    <h3>{workflow.workflowKey}</h3>
                    {workflow.objective && <p className="admin-muted">{workflow.objective}</p>}
                </div>
                <span className={`wf-badge wf-badge--${workflow.status}`}>{workflow.status}</span>
            </div>

            <WorkflowPipeline status={workflow.status} />

            {workflow.summary && <p className="wf-summary">“{workflow.summary}”</p>}

            <table className="wf-table">
                <thead>
                    <tr><th>#</th><th>Address</th><th>ETA</th><th>Leg (km)</th><th>On&nbsp;time</th></tr>
                </thead>
                <tbody>
                    {workflow.stops.map((s) => (
                        <tr key={s.id}>
                            <td>{s.sequence}</td>
                            <td>{s.address}</td>
                            <td>{fmt(s.eta)}</td>
                            <td>{s.distanceFromPrevKm.toFixed(1)}</td>
                            <td>{s.onTime === null ? '—' : s.onTime ? '✓' : '✗'}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={3}>Total</td>
                        <td>{workflow.totalDistanceKm.toFixed(1)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>

            {feedback && <div className={feedback.ok ? 'wf-ok' : 'admin-error'}>{feedback.msg}</div>}

            {canDecide && (
                <div className="wf-actions">
                    {(workflow.allocatedDriverId || workflow.allocationSummary) && (
                        <p className="admin-muted" style={{ margin: '0 0 0.5rem' }}>
                            🤖 Agent allocation pre-selected{workflow.allocationSummary ? `: ${workflow.allocationSummary}` : ''}. You can override below.
                        </p>
                    )}
                    <div className="wf-assign">
                        <label>
                            Driver
                            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                                <option value="">Select driver…</option>
                                {drivers.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
                            </select>
                        </label>
                        <label>
                            Vehicle
                            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                                <option value="">Select vehicle…</option>
                                {vehicles.map((v) => (
                                    <option key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <input
                        className="wf-reason"
                        placeholder="Reason / notes (for reject or revise)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="wf-btn-row">
                        <button className="wf-btn wf-btn--approve" disabled={acting} onClick={onApprove}>Approve &amp; dispatch</button>
                        <button className="wf-btn wf-btn--reject" disabled={acting}
                            onClick={() => run({ action: 'REJECT', decidedBy, reason })}>Reject</button>
                        <button className="wf-btn wf-btn--revise" disabled={acting}
                            onClick={() => run({ action: 'REVISE', decidedBy, reason, revisions: reason ? { note: reason } : null })}>Request revision</button>
                    </div>
                </div>
            )}
        </div>
    );
};
