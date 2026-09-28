import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../ordersApi';
import { DeliveryOrderResponse } from '../types';
import '../Orders.css';

export const OrderSuccessPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<DeliveryOrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            try {
                const data = await getOrderById(id);
                setOrder(data);
            } catch (err) {
                setError('Failed to fetch order details.');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) {
        return <div className="orders-loading">Loading Order Summary...</div>;
    }

    if (!order) {
        return <div className="orders-error">{error || 'Order not found.'}</div>;
    }

    return (
        <div className="orders-page-container">
            <div className="order-success-banner" style={{ textAlign: 'center', marginBottom: '2rem', padding: '2rem', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #10b981' }}>
                <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>✓</div>
                <h1 style={{ color: '#065f46', margin: '0 0 0.5rem 0' }}>Order Placed Successfully!</h1>
                <p style={{ color: '#047857', fontSize: '1.1rem', margin: 0 }}>
                    Your delivery order <strong>#{order.id.substring(0, 8).toUpperCase()}</strong> has been confirmed.
                </p>
            </div>

            <div className="orders-details-wrapper">
                <div className="orders-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem' }}>
                        <div>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>LOCATION DETAILS</h4>
                            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Pickup: {order.pickupCity}</p>
                            <p style={{ margin: '0 0 0.75rem 0', color: '#475569', fontSize: '0.9rem' }}>{order.pickupAddress}</p>
                            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 'bold' }}>Drop-off: {order.deliveryCity}</p>
                            <p style={{ margin: '0', color: '#475569', fontSize: '0.9rem' }}>{order.deliveryAddress}</p>
                            <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>
                                Preferred Date: <strong>{new Date(order.preferredPickupDate).toLocaleDateString()} at {order.preferredPickupTime}</strong>
                            </div>
                        </div>

                        <div>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>PACKAGE SUMMARY</h4>
                            <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold', fontSize: '1rem' }}>{order.packageDescription}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>
                                <div><strong>Priority:</strong> {order.priority}</div>
                                <div><strong>Handling:</strong> {order.specialHandling || 'Standard'}</div>
                                <div><strong>Weight:</strong> {order.weightKg} kg</div>
                                <div><strong>Dimensions:</strong> {order.lengthCm}x{order.widthCm}x{order.heightCm} cm</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>PAYMENT & FEES</h4>
                        {order.pricing ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.25rem 0' }}>Selected Method</p>
                                    <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{order.paymentMethod || 'Not Settled'}</strong>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.25rem 0' }}>Final Delivery Fee</p>
                                    <strong style={{ fontSize: '1.5rem', color: '#08006C' }}>Rs. {order.pricing.totalDeliveryFee.toLocaleString()}</strong>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: '#475569', fontStyle: 'italic', margin: 0 }}>Fee pending calculation...</p>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem' }}>
                    <button onClick={() => navigate(`/orders/${order.id}`)} className="orders-btn-secondary">
                        View Order Details
                    </button>
                    <button onClick={() => navigate('/orders/create')} className="orders-btn-primary">
                        Create Another Delivery
                    </button>
                    <button onClick={() => navigate('/orders')} className="orders-btn-secondary">
                        Back to My Orders
                    </button>
                </div>
            </div>
        </div>
    );
};
