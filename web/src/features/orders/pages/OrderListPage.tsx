import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeliveryOrderResponse } from '../types';
import { getMyOrders } from '../ordersApi';
import { OrderTable } from '../components/OrderTable';
import '../Orders.css';

export const OrderListPage: React.FC = () => {
    const [orders, setOrders] = useState<DeliveryOrderResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await getMyOrders();
            setOrders(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch orders.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="orders-container">
            <div className="orders-header">
                <h1 className="orders-title">My Delivery Orders</h1>
                <button
                    onClick={() => navigate('/orders/create')}
                    className="orders-btn-primary"
                >
                    Create Delivery Order
                </button>
            </div>

            {error && (
                <div style={{ color: '#dc2626', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div>Loading orders...</div>
            ) : (
                <OrderTable orders={orders} />
            )}
        </div>
    );
};
