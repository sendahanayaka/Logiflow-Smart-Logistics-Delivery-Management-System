import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../ordersApi';
import { CreateDeliveryOrderRequest } from '../types';
import { OrderForm } from '../components/OrderForm';
import '../Orders.css';

export const OrderCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (request: CreateDeliveryOrderRequest) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await createOrder(request);
            navigate(`/orders/${response.id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create order.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="orders-container">
            <div className="orders-header">
                <div>
                    <button
                        onClick={() => navigate('/orders')}
                        className="orders-btn-secondary"
                        style={{ marginBottom: '1rem' }}
                    >
                        &larr; Back to Orders
                    </button>
                    <h1 className="orders-title">Create Delivery Order</h1>
                </div>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: '#fef2f2', color: '#dc2626', borderLeft: '4px solid #dc2626', marginBottom: '1.5rem' }}>
                    {error}
                </div>
            )}

            <OrderForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
    );
};
