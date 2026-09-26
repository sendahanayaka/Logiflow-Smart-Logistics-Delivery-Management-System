import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../ordersApi';
import { DeliveryOrderResponse } from '../types';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import '../Orders.css';

export const OrderDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [order, setOrder] = useState<DeliveryOrderResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (id) {
            loadOrder(id);
        }
    }, [id]);

    const loadOrder = async (orderId: string) => {
        try {
            const data = await getOrderById(orderId);
            setOrder(data);
        } catch (err: any) {
            setError(err.message || 'Order could not be loaded.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!order || !window.confirm('Are you sure you want to cancel this order?')) return;

        setIsCancelling(true);
        setError('');
        setSuccessMsg('');

        try {
            const updated = await cancelOrder(order.id);
            setOrder(updated);
            setSuccessMsg('Order was successfully cancelled.');
        } catch (err: any) {
            setError(err.message || 'Failed to cancel order.');
        } finally {
            setIsCancelling(false);
        }
    };

    if (isLoading) return <div className="orders-container">Loading order details...</div>;

    return (
        <div className="orders-container">
            <button
                onClick={() => navigate('/orders')}
                className="orders-btn-secondary"
                style={{ marginBottom: '1.5rem' }}
            >
                &larr; Back to Orders
            </button>

            {error && (
                <div style={{ padding: '1rem', background: '#fef2f2', color: '#dc2626', borderLeft: '4px solid #dc2626', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            {successMsg && (
                <div style={{ padding: '1rem', background: '#f0fdf4', color: '#166534', borderLeft: '4px solid #166534', marginBottom: '1.5rem' }}>
                    {successMsg}
                </div>
            )}

            {order && (
                <div className="orders-panel">
                    <div className="orders-header" style={{ marginBottom: '1rem' }}>
                        <h2 className="orders-title" style={{ margin: 0 }}>Order Details: {order.id.split('-')[0]}</h2>
                        <OrderStatusBadge status={order.status} />
                    </div>

                    <p style={{ color: '#475569', fontSize: '0.875rem', marginBottom: '2rem' }}>
                        Created on {new Date(order.createdAt).toLocaleString()}
                        {order.updatedAt && ` (Updated: ${new Date(order.updatedAt).toLocaleString()})`}
                    </p>

                    <div className="orders-grid" style={{ marginBottom: '2rem' }}>
                        <div>
                            <h4 style={{ color: '#08006C', marginBottom: '0.5rem' }}>Pickup Information</h4>
                            <p><strong>Address:</strong> {order.pickupAddress}</p>
                            <p><strong>City:</strong> {order.pickupCity}</p>
                            <p><strong>Preferred:</strong> {new Date(order.preferredPickupDate).toLocaleDateString()} at {order.preferredPickupTime}</p>
                        </div>
                        <div>
                            <h4 style={{ color: '#08006C', marginBottom: '0.5rem' }}>Delivery Information</h4>
                            <p><strong>Address:</strong> {order.deliveryAddress}</p>
                            <p><strong>City:</strong> {order.deliveryCity}</p>
                            <p><strong>Priority:</strong> {order.priority}</p>
                        </div>
                    </div>

                    <div className="orders-grid">
                        <div>
                            <h4 style={{ color: '#08006C', marginBottom: '0.5rem' }}>Package Details</h4>
                            <p><strong>Description:</strong> {order.packageDescription}</p>
                            {order.specialHandling && <p><strong>Handling:</strong> {order.specialHandling}</p>}
                            <p>
                                <strong>Dimensions & Weight:</strong> {order.weightKg} kg
                                ({order.lengthCm}x{order.widthCm}x{order.heightCm} cm)
                            </p>
                        </div>
                        <div>
                            <h4 style={{ color: '#08006C', marginBottom: '0.5rem' }}>Recipient (Optional)</h4>
                            <p><strong>Name:</strong> {order.recipientName || 'N/A'}</p>
                            <p><strong>Contact:</strong> {order.recipientContact || 'N/A'}</p>
                        </div>
                    </div>

                    {order.status.toUpperCase() === 'PENDING' && (
                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="orders-btn-danger"
                            >
                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
