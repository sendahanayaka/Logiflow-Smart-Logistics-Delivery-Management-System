import React from 'react';
import '../Orders.css';

interface Props {
    status: string;
    /** Index of the live stage (0..5) across the non-cancelled steps. */
    activeStep?: number;
}

const FLOW = ['Order Created', 'Delivery Planning', 'Driver Assigned', 'Picked Up', 'In Transit', 'Delivered'];

export const OrderStatusTimeline: React.FC<Props> = ({ status, activeStep }) => {
    const isCancelled = status.toUpperCase() === 'CANCELLED';

    const active = activeStep ?? 1; // default to "Delivery Planning" when unknown
    const steps = isCancelled
        ? [
            { label: 'Order Created', state: 'completed' },
            { label: 'Order Cancelled', state: 'cancelled' }
        ]
        : FLOW.map((label, i) => ({
            label,
            state: i < active ? 'completed' : i === active ? 'current' : 'inactive',
        }));

    return (
        <div style={{ padding: '2.5rem 2rem', backgroundColor: '#FFFFFF', width: '100%', boxSizing: 'border-box' }}>
            <div className="orders-timeline-container">
                {steps.map((step, index) => (
                    <React.Fragment key={step.label}>
                        <div className={`orders-timeline-step ${step.state}`}>
                            <div className="orders-timeline-icon-wrapper">
                                <div className="orders-timeline-icon">
                                    {step.state === 'completed' && <span className="icon-check">&#10003;</span>}
                                    {step.state === 'cancelled' && <span className="icon-cross">&#10005;</span>}
                                    {step.state === 'current' && <span className="icon-dot"></span>}
                                </div>
                            </div>
                            <div className="orders-timeline-label">{step.label}</div>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`orders-timeline-bar ${step.state === 'completed' ? 'completed' : ''}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
