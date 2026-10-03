import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById, cancelOrder } from '../ordersApi';
import { DeliveryOrderResponse } from '../types';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderStatusTimeline } from '../components/OrderStatusTimeline';
import { OrderTrackingSection } from '../../delivery/components/OrderTrackingSection';
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

    if (isLoading) return <div className="orders-page-container">Loading order details...</div>;

    return (
        <div className="orders-page-container">
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
                <div className="orders-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Professional Header */}
                    <div style={{ backgroundColor: '#f8fafc', padding: '2rem 2.5rem', borderBottom: '1px solid #e2e8f0' }}>
                        <div className="orders-details-title-row" style={{ marginBottom: '0.5rem' }}>
                            <h2 className="orders-title" style={{ fontSize: '1.5rem', margin: 0 }}>Order Details</h2>
                            <div className="orders-id-chip">#{order.id.split('-')[0].toUpperCase()}</div>
                            <div className="status-badge-wrapper"><OrderStatusBadge status={order.status} /></div>
                        </div>
                        <p className="orders-details-meta" style={{ margin: 0 }}>
                            Created on <strong>{new Date(order.createdAt).toLocaleString()}</strong>
                            {order.updatedAt && ` · Updated: ${new Date(order.updatedAt).toLocaleString()}`}
                        </p>
                    </div>

                    {/* Live stage timeline + delivery tracking (driver, ETA). The
                        timeline is driven by the live shipment status inside the section;
                        a cancelled order shows the static cancelled timeline instead. */}
                    {order.status.toUpperCase() === 'CANCELLED' ? (
                        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <OrderStatusTimeline status="Cancelled" />
                        </div>
                    ) : (
                        <OrderTrackingSection orderId={order.id} />
                    )}

                    {/* Order Information 1-Card System */}
                    <div style={{ background: '#FFFFFF', padding: '2.5rem 2.5rem 1.5rem', borderBottom: order.intelligence ? '1px solid #e2e8f0' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>PICKUP LOCATION</h4>
                                <p style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 0.25rem 0' }}>{order.pickupAddress}</p>
                                <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.5rem 0' }}>{order.pickupCity}</p>
                                <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                                    Preferred time: <strong>{new Date(order.preferredPickupDate).toLocaleDateString()} at {order.preferredPickupTime.substring(0, 5)}</strong>
                                </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>DELIVERY LOCATION</h4>
                                <p style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 0.25rem 0' }}>{order.deliveryAddress}</p>
                                <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.5rem 0' }}>{order.deliveryCity}</p>
                                <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                                    Priority: <strong>{order.priority.toUpperCase()}</strong>
                                </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>PACKAGE DETAILS</h4>
                                <p style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 0.25rem 0' }}>{order.packageDescription}</p>
                                <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.5rem 0' }}>{order.weightKg} kg &middot; {((order.lengthCm * order.widthCm * order.heightCm) / 1000000).toFixed(4)} m³</p>
                                {order.specialHandling && (
                                    <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                                        Special Handling: <strong>{order.specialHandling}</strong>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>RECIPIENT INFO</h4>
                                <p style={{ fontSize: '1rem', color: '#0f172a', margin: '0 0 0.25rem 0' }}>{order.recipientName || 'Not specified'}</p>
                                <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 0.5rem 0' }}>{order.recipientContact || 'No contact provided'}</p>
                                {order.paymentMethod && (
                                    <div style={{ fontSize: '0.9rem', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Payment Method:</span>
                                        <strong>{order.paymentMethod}</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Intelligence AI Dashboard */}
                    {order.intelligence && (
                        <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '2rem 2.5rem', borderTop: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: '0 0 1.5rem 0', color: '#08006C', fontSize: '1.25rem' }}>
                                Order Intelligence Data
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: '#FD5901', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>ORDER ANALYSIS</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 0.25rem 0' }}>Volume: {order.intelligence.volumeM3} m³</p>
                                    <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 0.5rem 0' }}>Weight Classification: {order.intelligence.weightClassification}</p>
                                    <div style={{ fontSize: '0.9rem', color: '#0f172a' }}>Handling: <strong>{order.intelligence.handlingRequirement}</strong></div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '0.85rem', color: '#FD5901', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>PLANNING INFORMATION</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 0.25rem 0' }}>Rec. Priority: {order.intelligence.recommendedPriority}</p>
                                    <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 0.5rem 0' }}>
                                        Risks: {order.intelligence.risksOrAmbiguities?.length ? order.intelligence.risksOrAmbiguities.join(', ') : 'None'}
                                    </p>
                                </div>

                                <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>DELIVERY PRICING</h4>
                                    {!order.pricing ? (
                                        <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Calculating...</p>
                                    ) : (
                                        <div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.4rem', fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
                                                <span>Base Fee:</span><span>Rs. {order.pricing.baseFee.toFixed(2)}</span>
                                                <span>Distance Charge:</span><span>Rs. {order.pricing.distanceCharge.toFixed(2)}</span>
                                                <span>Weight & Vol:</span><span>Rs. {(order.pricing.weightCharge + order.pricing.volumeCharge).toFixed(2)}</span>
                                                <span>Additions:</span><span>Rs. {(order.pricing.priorityCharge + order.pricing.handlingCharge).toFixed(2)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Total Fee:</span>
                                                <strong style={{ fontSize: '1.25rem', color: '#08006C' }}>Rs. {order.pricing.totalDeliveryFee.toLocaleString()}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cancel Actions */}
                    {order.status.toUpperCase() === 'PENDING' && (
                        <div className="orders-actions-row" style={{ padding: '2rem', backgroundColor: '#fff1f2', borderTop: '1px solid #fee2e2', display: 'flex', justifyContent: 'flex-start' }}>
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="orders-btn-danger-outline"
                                style={{ margin: 0 }}
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
