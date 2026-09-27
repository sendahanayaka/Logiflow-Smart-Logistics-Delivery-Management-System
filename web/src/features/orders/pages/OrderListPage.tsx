import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeliveryOrderResponse, DispatchOrder } from '../types';
import { getMyOrders, useGetDispatchOrdersQuery } from '../ordersApi';
import { OrderTable } from '../components/OrderTable';
import { MultiOrderTripPanel } from '../../fleet/components/MultiOrderTripPanel';
import { FleetHeader } from '../../fleet/components/FleetHeader';
import '../Orders.css';

export const CustomerOrderListPage: React.FC = () => {
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


export const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading, isError, refetch } = useGetDispatchOrdersQuery();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Multi-Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.destination.toLowerCase().includes(term) ||
        (order.customerName && order.customerName.toLowerCase().includes(term));

      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Selected Orders Objects List
  const selectedOrders = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  // Checkbox Selection Handlers
  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const isAllSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  return (
    <section className="users-page" aria-labelledby="orders-page-title">
      <FleetHeader
        title="Multi-Order AI Trip Builder"
        subtitle="Select multiple compatible dispatch-ready orders to consolidate into a single operational trip assigned to one driver & vehicle."
        breadcrumbs={[{ label: 'Multi-Order Trips' }]}
        activeTab="trips"
        actionButton={
          <button type="button" className="button button--secondary" onClick={() => refetch()}>
            Refresh Orders
          </button>
        }
      />

      {/* Main Responsive Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(320px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Orders Selection Table */}
        <div>
          {/* Search & Filter Toolbar */}
          <div className="users-toolbar" style={{ marginBottom: '1rem' }}>
            <div className="users-toolbar__filters" style={{ width: '100%', display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="toolbar-search"
                placeholder="Search orders by ID, destination, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                className="toolbar-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="READY">Ready for Dispatch</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="IN_TRANSIT">In Transit</option>
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="details-card" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
              Loading ready orders...
            </div>
          )}

          {isError && (
            <div className="error-message">
              <h3>Failed to Load Orders</h3>
              <p>Unable to retrieve orders list. Click refresh to retry.</p>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="table-responsive" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        aria-label="Select all orders"
                      />
                    </th>
                    <th>Order ID</th>
                    <th>Destination</th>
                    <th>Weight</th>
                    <th>Volume</th>
                    <th>Priority</th>
                    <th>Delivery Window</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No dispatch-ready orders available.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isSelected = selectedOrderIds.includes(order.id);
                      return (
                        <tr
                          key={order.id}
                          style={{
                            backgroundColor: isSelected ? '#f0f4ff' : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleToggleSelectOrder(order.id)}
                        >
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOrder(order.id)}
                              aria-label={`Select ${order.id}`}
                            />
                          </td>
                          <td>
                            <strong style={{ color: '#08006C' }}>{order.id}</strong>
                            {order.customerName && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {order.customerName}
                              </div>
                            )}
                          </td>
                          <td>
                            <strong>{order.destination}</strong>
                          </td>
                          <td>{order.weightKg} kg</td>
                          <td>{order.volumeM3} m³</td>
                          <td>
                            <span
                              className={`badge ${order.priority === 'EXPRESS'
                                  ? 'badge--danger'
                                  : order.priority === 'HIGH'
                                    ? 'badge--warning'
                                    : 'badge--info'
                                }`}
                              style={{ fontSize: '0.72rem' }}
                            >
                              {order.priority}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                            {order.deliveryWindowStart} - {order.deliveryWindowEnd}
                          </td>
                          <td>
                            <span className="badge badge--success" style={{ fontSize: '0.75rem' }}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Sticky AI Multi-Order Trip Panel */}
        <div>
          <MultiOrderTripPanel
            selectedOrders={selectedOrders}
            onClearSelection={() => setSelectedOrderIds([])}
          />
        </div>
      </div>
    </section>
  );
};

export default OrderListPage;
