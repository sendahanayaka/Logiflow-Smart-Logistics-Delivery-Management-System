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

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders.');
    } finally {
      setIsLoading(false);
    }
  };

  // Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status.toUpperCase() === 'PENDING').length;
  const confirmedOrders = orders.filter(o => o.status.toUpperCase() === 'CONFIRMED').length;
  const cancelledOrders = orders.filter(o => o.status.toUpperCase() === 'CANCELLED').length;
  const completedOrders = orders.filter(o => o.status.toUpperCase() === 'COMPLETED').length;

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(o =>
        o.id.toLowerCase().includes(term) ||
        o.pickupCity.toLowerCase().includes(term) ||
        o.deliveryCity.toLowerCase().includes(term) ||
        o.pickupAddress.toLowerCase().includes(term) ||
        o.deliveryAddress.toLowerCase().includes(term)
      );
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status.toUpperCase() === statusFilter);
    }

    // Priority Filter
    if (priorityFilter !== 'ALL') {
      result = result.filter(o => o.priority.toUpperCase() === priorityFilter);
    }

    // Date Filter (simple representation against createdAt)
    if (dateFilter !== 'ALL') {
      const now = new Date();
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        if (dateFilter === 'TODAY') {
          return d.toDateString() === now.toDateString();
        }
        if (dateFilter === 'WEEK') {
          const diff = now.getTime() - d.getTime();
          return diff < 7 * 24 * 60 * 60 * 1000;
        }
        if (dateFilter === 'MONTH') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'OLDEST':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'PICKUP_DATE':
          return new Date(a.preferredPickupDate).getTime() - new Date(b.preferredPickupDate).getTime();
        case 'PRIORITY':
          return a.priority.localeCompare(b.priority);
        case 'NEWEST':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [orders, searchTerm, statusFilter, priorityFilter, dateFilter, sortOrder]);

  return (
    <div className="orders-page-container">
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: '#08006C', margin: '0 0 0.25rem 0', fontSize: '2rem' }}>My Delivery Orders</h1>
          <p style={{ color: '#475569', margin: 0, fontSize: '1.05rem' }}>Track and manage all your deliveries in one place.</p>
        </div>
        <button onClick={() => navigate('/orders/create')} className="orders-btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
          + Create Delivery Order
        </button>
      </div>

      {error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #dc2626', color: '#991b1b', padding: '2rem', borderRadius: '8px', textAlign: 'center', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Unable to load your orders</h3>
          <p style={{ margin: '0 0 1rem 0' }}>{error}</p>
          <button onClick={loadOrders} className="orders-btn-secondary">Retry</button>
        </div>
      ) : isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: '#FFFFFF', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', animation: 'pulse 1.5s infinite' }}>
              <div style={{ height: '24px', background: '#e2e8f0', borderRadius: '4px', width: '50%', marginBottom: '1rem' }} />
              <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '80%', marginBottom: '0.5rem' }} />
              <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '60%' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Orders', count: totalOrders, color: '#08006C', bg: '#f1f5f9' },
              { label: 'Pending', count: pendingOrders, color: '#ca8a04', bg: '#fefce8' },
              { label: 'Confirmed', count: confirmedOrders, color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Completed', count: completedOrders, color: '#0d9488', bg: '#f0fdfa' },
              { label: 'Cancelled', count: cancelledOrders, color: '#dc2626', bg: '#fef2f2' },
            ].map(m => (
              <div key={m.label} style={{ background: '#FFFFFF', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ background: m.bg, color: m.color, width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {m.count}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{m.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FILTERS & SEARCH */}
          <div style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <div style={{ flex: '1 1 300px' }}>
              <input
                type="text"
                placeholder="Search by order ID, pickup location or delivery location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <option value="ALL">Status: All</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <option value="ALL">Priority: All</option>
                <option value="STANDARD">Standard</option>
                <option value="EXPRESS">Express</option>
              </select>
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <option value="ALL">Date: All</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">This Week</option>
                <option value="MONTH">This Month</option>
              </select>
              <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                <option value="NEWEST">Sort: Newest</option>
                <option value="OLDEST">Sort: Oldest</option>
                <option value="PICKUP_DATE">Sort: Pickup Date</option>
                <option value="PRIORITY">Sort: Priority</option>
              </select>
              {searchTerm && <button onClick={() => setSearchTerm('')} className="orders-btn-secondary" style={{ padding: '0.75rem 1rem' }}>Clear Search</button>}
            </div>
          </div>

          {/* ORDERS LIST */}
          {filteredOrders.length === 0 ? (
            <div style={{ background: '#FFFFFF', padding: '4rem 2rem', borderRadius: '8px', border: '2px dashed #cbd5e1', textAlign: 'center' }}>
              <h3 style={{ color: '#08006C', margin: '0 0 0.5rem 0' }}>{orders.length === 0 ? "No delivery orders yet" : "No orders match your filters"}</h3>
              <p style={{ color: '#64748b', margin: '0 0 1.5rem 0' }}>{orders.length === 0 ? "Create your first delivery order and start tracking it here." : "Try adjusting your search criteria or resetting the filters."}</p>
              {orders.length === 0 && <button onClick={() => navigate('/orders/create')} className="orders-btn-primary">Create Delivery Order</button>}
            </div>
          ) : (
            <div className="table-responsive" style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem' }}>ORDER ID</th>
                    <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem' }}>DATE</th>
                    <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem' }}>ROUTE</th>
                    <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem' }}>PRIORITY</th>
                    <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem' }}>STATUS</th>
                    <th style={{ padding: '1rem', color: '#475569', fontWeight: '600', fontSize: '0.85rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: '#08006C' }}>#{order.id.substring(0, 8).toUpperCase()}</td>
                      <td style={{ padding: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#334155' }}>{order.pickupCity}</span>
                        <span style={{ color: '#94a3b8', margin: '0 0.5rem' }}>&rarr;</span>
                        <span style={{ color: '#334155' }}>{order.deliveryCity}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600' }}>
                          {order.priority}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 'bold',
                          background: order.status.toUpperCase() === 'PENDING' ? '#fefce8' : order.status.toUpperCase() === 'CONFIRMED' ? '#f0fdf4' : order.status.toUpperCase() === 'CANCELLED' ? '#fef2f2' : '#f1f5f9',
                          color: order.status.toUpperCase() === 'PENDING' ? '#ca8a04' : order.status.toUpperCase() === 'CONFIRMED' ? '#16a34a' : order.status.toUpperCase() === 'CANCELLED' ? '#dc2626' : '#475569',
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => navigate(`/orders/${order.id}`)} className="orders-btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'transparent', border: '1px solid #cbd5e1', color: '#08006C' }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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
