import React from 'react';
import '../Orders.css';

interface Props {
    status: string;
}

export const OrderStatusTimeline: React.FC<Props> = ({ status }) => {
    const isCancelled = status.toUpperCase() === 'CANCELLED';

    const steps = isCancelled
        ? [
            { label: 'Order Created', state: 'completed' },
            { label: 'Order Cancelled', state: 'cancelled' }
        ]
        : [
            { label: 'Order Created', state: 'completed' },
            { label: 'Delivery Planning', state: 'current' },
            { label: 'Driver Assigned', state: 'inactive' },
            { label: 'Picked Up', state: 'inactive' },
            { label: 'In Transit', state: 'inactive' },
            { label: 'Delivered', state: 'inactive' }
        ];

    return (
        <div className="orders-timeline-card">
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
