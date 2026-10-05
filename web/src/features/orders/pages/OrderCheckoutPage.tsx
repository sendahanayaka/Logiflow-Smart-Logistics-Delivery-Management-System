import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../ordersApi';
import { API_BASE_URL } from '../../../app/api';
import { DeliveryOrderResponse } from '../types';
import '../Orders.css';

export const OrderCheckoutPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [order, setOrder] = useState<DeliveryOrderResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    // Mock Payment States
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    // Mock File State 
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    // Clear underlying UI validation states when switching methods
    useEffect(() => {
        setCardName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setReceiptFile(null);
    }, [paymentMethod]);

    useEffect(() => {
        let isMounted = true;
        let interval: ReturnType<typeof setInterval>;

        const fetchOrder = async () => {
            if (!id) return;
            try {
                const data = await getOrderById(id);
                if (isMounted) {
                    setOrder(data);
                    setLoading(false);
                    // Stop polling if we have pricing OR we retried enough times
                    if (data.pricing) {
                        clearInterval(interval);
                    } else if (retryCount > 2) {
                        clearInterval(interval);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to fetch order details. Please try again.');
                    setLoading(false);
                }
            }
        };

        // Initial fetch
        fetchOrder();

        // Limited polling (max 3 times)
        interval = setInterval(() => {
            setRetryCount(prev => {
                if (prev >= 2) {
                    clearInterval(interval);
                    return prev;
                }
                if (!order?.pricing) {
                    fetchOrder();
                } else {
                    clearInterval(interval);
                }
                return prev + 1;
            });
        }, 2000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [id]);

    const isPaymentValid = () => {
        if (!paymentMethod) return false;

        if (paymentMethod === 'Card Payment') {
            if (cardName.length < 2 || cardNumber.length < 19 || cardExpiry.length < 5 || cardCvv.length < 3) return false;
        }

        if (paymentMethod === 'Online Bank Transfer') {
            if (!receiptFile) return false;
        }

        return true;
    };

    const handleConfirm = async () => {
        if (!isPaymentValid()) {
            if (paymentMethod === 'Online Bank Transfer') {
                setError('Please upload your bank transfer receipt before continuing.');
            } else if (paymentMethod === 'Card Payment') {
                setError('Please complete all valid card details before continuing.');
            } else {
                setError('Please complete the selected payment details to proceed.');
            }
            return;
        }

        setConfirming(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/orders/${id}/checkout`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ paymentMethod })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Payment confirmation failed');
            }

            navigate(`/orders/${id}/success`);
        } catch (err: any) {
            setError(err.message || 'An error occurred during checkout.');
        } finally {
            setConfirming(false);
        }
    };

    if (loading) {
        return <div className="orders-loading">Loading Checkout Details...</div>;
    }

    if (!order) {
        return <div className="orders-error">{error || 'Order not found.'}</div>;
    }

    if (order.status.toUpperCase() === 'CONFIRMED') {
        return (
            <div className="orders-error">
                This order has already been confirmed.
                <button className="orders-btn-primary" style={{ marginTop: '1rem', display: 'block' }} onClick={() => navigate(`/orders/${id}`)}>View Order Details</button>
            </div>
        );
    }

    return (
        <div className="orders-page-container">
            <div className="orders-header">
                <div>
                    <h1 className="orders-page-title">Order Checkout</h1>
                    <p className="orders-page-subtitle">Review your delivery details, check the fee, and confirm payment.</p>
                </div>
                <button className="orders-btn-secondary" onClick={() => navigate(-1)}>Back</button>
            </div>

            {error && (
                <div className="orders-alert orders-alert-danger">
                    {error}
                </div>
            )}

            <div className="orders-panel" style={{ marginTop: '2rem', padding: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '2rem' }}>
                    <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>DELIVERY DETAILS</h4>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>From: {order.pickupCity}</p>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>To: {order.deliveryCity}</p>
                        <div style={{ color: '#475569', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            <span>Pickup: <strong>{new Date(order.preferredPickupDate).toLocaleDateString()}</strong></span>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>PACKAGE DETAILS</h4>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{order.packageDescription}</p>
                        <p style={{ margin: '0', color: '#475569', fontSize: '0.9rem' }}>
                            {order.weightKg} kg &middot; {order.specialHandling || 'Standard'}
                        </p>
                    </div>

                    <div style={{ paddingLeft: '1.5rem', borderLeft: '2px solid #f8fafc' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: order.pricing ? '#08006C' : '#dc2626', fontSize: '0.85rem', textTransform: 'uppercase' }}>DELIVERY PRICING</h4>

                        {(!order.pricing && retryCount < 3) && (
                            <div style={{ padding: '0.5rem 0' }}>
                                <div className="orders-loading-spinner" style={{ display: 'inline-block', marginRight: '10px' }} />
                                <span style={{ color: '#718096', fontStyle: 'italic', fontSize: '0.9rem' }}>Calculating delivery fee...</span>
                            </div>
                        )}

                        {(!order.pricing && retryCount >= 3) && (
                            <div style={{ padding: '0.5rem 0' }}>
                                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠️ AI Pricing Pending</span>
                                <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '0.5rem' }}>Settlement upon delivery.</p>
                            </div>
                        )}

                        {order.pricing && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.4rem', fontSize: '0.9rem', color: '#334155', marginBottom: '1rem' }}>
                                    <span>Base Fee:</span><span>Rs. {order.pricing.baseFee.toFixed(2)}</span>
                                    <span>Distance Charge:</span><span>Rs. {order.pricing.distanceCharge.toFixed(2)}</span>
                                    <span>Weight Charge:</span><span>Rs. {order.pricing.weightCharge.toFixed(2)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '1rem' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>Total Fee:</span>
                                    <strong style={{ fontSize: '1.2rem', color: '#08006C' }}>
                                        Rs. {order.pricing.totalDeliveryFee.toLocaleString()}
                                    </strong>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* DYNAMIC PAYMENT METHOD UI */}
                <div style={{ padding: '0', marginTop: '2.5rem' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#08006C', fontSize: '1.25rem' }}>PAYMENT METHOD</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        {[
                            { id: 'Cash on Pickup', title: 'Cash on Pickup', desc: 'Pay the delivery fee in cash when your package is collected.' },
                            { id: 'Card Payment', title: 'Card Payment', desc: 'Pay using your debit or credit card.' },
                            { id: 'Online Bank Transfer', title: 'Online Bank Transfer', desc: 'Transfer the amount and upload your receipt.' }
                        ].map(method => (
                            <div
                                key={method.id}
                                onClick={() => !confirming && setPaymentMethod(method.id)}
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: '8px',
                                    border: paymentMethod === method.id ? '2px solid #08006C' : '1px solid #cbd5e1',
                                    backgroundColor: paymentMethod === method.id ? '#f8fafc' : '#FFFFFF',
                                    cursor: confirming ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        border: paymentMethod === method.id ? '6px solid #08006C' : '2px solid #cbd5e1',
                                        backgroundColor: '#FFFFFF', boxSizing: 'border-box'
                                    }} />
                                    <h4 style={{ margin: 0, color: '#08006C', fontSize: '1.05rem' }}>{method.title}</h4>
                                </div>
                                <p style={{ margin: '0.5rem 0 0 2rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.4' }}>{method.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* DYNAMIC FORM SEGMENTS */}
                    <div style={{ minHeight: '300px' }}>
                        {paymentMethod === 'Card Payment' && (
                            <div style={{ background: '#FFFFFF', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', maxWidth: '600px' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', color: '#08006C', fontSize: '1.1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>CARD PAYMENT</h4>
                                <div className="orders-form-group">
                                    <label>Cardholder Name</label>
                                    <input type="text" className="orders-form-control" placeholder="John Doe" value={cardName} onChange={e => setCardName(e.target.value)} disabled={confirming} />
                                </div>
                                <div className="orders-form-group">
                                    <label>Card Number</label>
                                    <input type="text" className="orders-form-control" placeholder="1234 5678 9101 1121" maxLength={19} value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())} disabled={confirming} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="orders-form-group">
                                        <label>Expiry Date (MM/YY)</label>
                                        <input type="text" className="orders-form-control" placeholder="12/25" maxLength={5} value={cardExpiry} onChange={e => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                            setCardExpiry(val);
                                        }} disabled={confirming} />
                                    </div>
                                    <div className="orders-form-group">
                                        <label>CVV</label>
                                        <input type="password" className="orders-form-control" placeholder="123" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))} disabled={confirming} />
                                    </div>
                                </div>
                                {!isPaymentValid() && cardName.length > 0 && <p style={{ color: '#dc2626', fontSize: '0.9rem', margin: '0' }}>Please complete all valid card details before continuing.</p>}
                            </div>
                        )}

                        {paymentMethod === 'Online Bank Transfer' && (
                            <div style={{ background: '#FFFFFF', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', maxWidth: '800px' }}>
                                <h4 style={{ margin: '0 0 1.5rem 0', color: '#08006C', fontSize: '1.1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>ONLINE BANK TRANSFER</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                        <h5 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.95rem', textTransform: 'uppercase' }}>Bank Account Details</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: '#475569' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bank Name:</span> <strong>[Company Bank]</strong></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account Name:</span> <strong>[LogiFlow Company Account]</strong></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Account Number:</span> <strong>[Account Number]</strong></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch:</span> <strong>[Branch Name]</strong></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch Code:</span> <strong>[Branch Code]</strong></div>
                                        </div>
                                    </div>

                                    <div>
                                        <h5 style={{ margin: '0 0 1rem 0', color: '#334155', fontSize: '0.95rem' }}>Upload Transfer Receipt</h5>
                                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>Supported formats: PDF, JPG, JPEG, PNG</p>

                                        {!receiptFile ? (
                                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#f1f5f9', cursor: 'pointer', transition: 'border 0.2s', textAlign: 'center' }}>
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                <span style={{ color: '#08006C', fontWeight: 'bold' }}>Click to upload file</span>
                                                <input type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" disabled={confirming} onChange={e => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        const file = e.target.files[0];
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            alert("File size must be less than 5MB");
                                                            return;
                                                        }
                                                        setReceiptFile(file);
                                                    }
                                                }} />
                                            </label>
                                        ) : (
                                            <div style={{ padding: '1.5rem', border: '1px solid #10b981', borderRadius: '8px', background: '#ecfdf5', position: 'relative' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                                    <div style={{ overflow: 'hidden' }}>
                                                        <div style={{ fontWeight: 'bold', color: '#065f46', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{receiptFile.name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#047857' }}>{(receiptFile.size / 1024).toFixed(1)} KB</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setReceiptFile(null)} disabled={confirming} style={{ marginTop: '1rem', background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer', padding: '0', fontSize: '0.85rem' }}>Remove file</button>
                                            </div>
                                        )}

                                        {!isPaymentValid() && paymentMethod === 'Online Bank Transfer' && (
                                            <p style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '1rem' }}>Please upload your bank transfer receipt before continuing.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {paymentMethod === 'Cash on Pickup' && (
                            <div style={{ opacity: 0.8 }}>
                                <p style={{ color: '#475569', fontSize: '1rem' }}>No further payment details required. You will pay directly upon tracking collection.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="submit-action-container" style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                    <button
                        onClick={handleConfirm}
                        disabled={confirming || !isPaymentValid()}
                        className="orders-btn-primary btn-large"
                    >
                        {confirming ? 'Confirming Order...' : 'Confirm Order & Pay'}
                    </button>
                </div>
            </div>
        </div>
    );
};
