import React from 'react';
import '../Orders.css';

interface Props {
    status: string;
}

export const OrderStatusBadge: React.FC<Props> = ({ status }) => {
    let className = 'status-default';

    if (status.toUpperCase() === 'PENDING') className = 'status-pending';
    if (status.toUpperCase() === 'CANCELLED') className = 'status-cancelled';

    return (
        <span className={`status-badge ${className}`}>
            {status}
        </span>
    );
};
