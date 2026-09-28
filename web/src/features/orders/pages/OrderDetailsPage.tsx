import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../ordersApi';
import { DeliveryOrderResponse } from '../types';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderStatusTimeline } from '../components/OrderStatusTimeline';
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
                style={{ marginBottom: '2rem' }}
            >
                &larr; Back to Orders
            </button>

            {error && (
                <div className="orders-alert orders-alert-danger">
                    {error}
                </div>
            )}

            {successMsg && (
                <div className="orders-alert orders-alert-success">
                    {successMsg}
                </div>
            )}

            {order && (
                <div className="orders-details-wrapper">
                    {/* Professional Header */}
                    <div className="orders-details-header">
                        <div className="orders-details-title-row">
                            <h2 className="orders-title">Order Details</h2>
                            <div className="orders-id-chip">#{order.id.split('-')[0].toUpperCase()}</div>
                            <div className="status-badge-wrapper"><OrderStatusBadge status={order.status} /></div>
                        </div>
                        <p className="orders-details-meta">
                            Created on <strong>{new Date(order.createdAt).toLocaleString()}</strong>
                            {order.updatedAt && ` · Updated: ${new Date(order.updatedAt).toLocaleString()}`}
                        </p>
                    </div>

                    {/* Timeline Component */}
                    <OrderStatusTimeline status={order.status} />

                    {/* Order Information 2-Column Grid */}
                    <div className="orders-info-grid">
                        <div className="orders-info-card">
                            <h4 className="info-card-title">PICKUP LOCATION</h4>
                            <p className="info-card-primary">{order.pickupAddress}</p>
                            <p className="info-card-secondary">{order.pickupCity}</p>
                            <div className="info-card-footer">
                                <span>Preferred time: <strong>{new Date(order.preferredPickupDate).toLocaleDateString()} at {order.preferredPickupTime.substring(0, 5)}</strong></span>
                            </div>
                        </div>

                        <div className="orders-info-card">
                            <h4 className="info-card-title">DELIVERY LOCATION</h4>
                            <p className="info-card-primary">{order.deliveryAddress}</p>
                            <p className="info-card-secondary">{order.deliveryCity}</p>
                            <div className="info-card-footer">
                                <span>Priority: <strong>{order.priority.toUpperCase()}</strong></span>
                            </div>
                        </div>

                        <div className="orders-info-card">
                            <h4 className="info-card-title">PACKAGE DETAILS</h4>
                            <p className="info-card-primary">{order.packageDescription}</p>
                            <p className="info-card-secondary">
                                {order.weightKg} kg &middot; {order.lengthCm}x{order.widthCm}x{order.heightCm} cm
                            </p>
                            {order.specialHandling && (
                                <div className="info-card-footer">
                                    <span>Special Handling: <strong>{order.specialHandling}</strong></span>
                                </div>
                            )}
                        </div>

                        <div className="orders-info-card">
                            <h4 className="info-card-title">RECIPIENT INFO</h4>
                            <p className="info-card-primary">{order.recipientName || 'Not specified'}</p>
                            <p className="info-card-secondary">{order.recipientContact || 'No contact provided'}</p>
                        </div>
                    </div>

                    {/* Order Intelligence AI Dashboard */}
                    {order.intelligence && (
                        <div style={{ marginTop: '2.5rem', backgroundColor: '#fdfdfd', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-navy, #08006C)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                Order Intelligence
                            </h3>
                            <div className="orders-info-grid">
                                <div className="orders-info-card" style={{ borderColor: 'var(--color-orange, #FD5901)' }}>
                                    <h4 className="info-card-title" style={{ color: 'var(--color-orange, #FD5901)' }}>ORDER ANALYSIS</h4>
                                    <p className="info-card-primary">Package Volume: {order.intelligence.volumeM3} m³</p>
                                    <p className="info-card-secondary">Weight Classification: {order.intelligence.weightClassification}</p>
                                    <div className="info-card-footer">
                                        <span>Handling Requirement: <strong>{order.intelligence.handlingRequirement}</strong></span>
                                    </div>
                                </div>

                                <div className="orders-info-card" style={{ borderColor: 'var(--color-orange, #FD5901)' }}>
                                    <h4 className="info-card-title" style={{ color: 'var(--color-orange, #FD5901)' }}>PLANNING INFORMATION</h4>
                                    <p className="info-card-primary">Recommended Priority: {order.intelligence.recommendedPriority}</p>
                                    <p className="info-card-secondary">
                                        Risks / Ambiguities: {order.intelligence.risksOrAmbiguities?.length ? order.intelligence.risksOrAmbiguities.join(', ') : 'None detected'}
                                    </p>
                                    <div className="info-card-footer">
                                        <span>Status: <strong>Agentic AI Ready</strong></span>
                                    </div>
                                </div>

                                <div className="orders-info-card" style={{ backgroundColor: '#f5f7fa', opacity: 0.8 }}>
                                    <h4 className="info-card-title" style={{ color: '#4a5568' }}>FLEET INTEGRATION</h4>
                                    <p className="info-card-primary" style={{ color: '#718096' }}>Recommended Vehicle: <em>Not available yet</em></p>
                                    <p className="info-card-secondary" style={{ color: '#718096' }}>Estimated Distance / Time: <em>Pending integration</em></p>
                                    <div className="info-card-footer">
                                        <span>Estimated Cost: <strong>Pending integration</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cancel Actions */}
                    {order.status.toUpperCase() === 'PENDING' && (
                        <div className="orders-actions-row">
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="orders-btn-danger-outline"
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
