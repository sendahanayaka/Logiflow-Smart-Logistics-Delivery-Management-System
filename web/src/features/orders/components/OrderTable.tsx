import React from 'react';
import { DeliveryOrderResponse } from '../types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { useNavigate } from 'react-router-dom';
import '../Orders.css';

interface Props {
    orders: DeliveryOrderResponse[];
}

export const OrderTable: React.FC<Props> = ({ orders }) => {
    const navigate = useNavigate();

    if (orders.length === 0) {
        return (
            <div className="orders-panel" style={{ textAlign: 'center', color: '#475569' }}>
                <p>You have no delivery orders yet.</p>
            </div>
        );
    }

    return (
        <div className="orders-panel" style={{ overflowX: 'auto' }}>
            <table className="orders-table">
                <thead>
                    <tr>
                        <th>ID / Reference</th>
                        <th>Pickup</th>
                        <th>Delivery</th>
                        <th>Priority</th>
                        <th>Schedule</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td style={{ fontSize: '0.875rem' }}>{order.id.split('-')[0]}</td>
                            <td>{order.pickupCity}</td>
                            <td>{order.deliveryCity}</td>
                            <td>{order.priority}</td>
                            <td>
                                {new Date(order.preferredPickupDate).toLocaleDateString()}
                            </td>
                            <td>
                                <OrderStatusBadge status={order.status} />
                            </td>
                            <td>
                                <button
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                    className="orders-btn-secondary"
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                >
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
