import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetDriversQuery, useDeleteDriverMutation } from '../api/fleetApi';
import { DriverTable, SortField, SortDirection } from '../components/DriverTable';
import { Driver, DriverStatus } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const DriverListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: drivers = [], isLoading, isError, error, refetch } = useGetDriversQuery();
  const [deleteDriver, { isLoading: isDeleting }] = useDeleteDriverMutation();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('licenseNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete Modal State
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  // Search & Filter Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSortField('licenseNumber');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtering Logic
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        driver.licenseNumber.toLowerCase().includes(term) ||
        (driver.phoneNumber && driver.phoneNumber.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === 'ALL' || driver.status === Number(statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchTerm, statusFilter]);

  // Sorting Logic
  const sortedDrivers = useMemo(() => {
    return [...filteredDrivers].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'licenseNumber') {
        comparison = a.licenseNumber.localeCompare(b.licenseNumber);
      } else if (sortField === 'licenseExpiryDate') {
        comparison =
          new Date(a.licenseExpiryDate).getTime() - new Date(b.licenseExpiryDate).getTime();
      } else if (sortField === 'status') {
        comparison = a.status - b.status;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredDrivers, sortField, sortDirection]);

  // Pagination Logic
  const totalItems = sortedDrivers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedDrivers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDrivers.slice(start, start + pageSize);
  }, [sortedDrivers, currentPage, pageSize]);

  // Action Handlers
  const handleAddDriver = () => {
    navigate('/drivers/new');
  };

  const handleViewDriver = (driver: Driver) => {
    navigate(`/drivers/${driver.id}`);
  };

  const handleEditDriver = (driver: Driver) => {
    navigate(`/drivers/${driver.id}/edit`);
  };

  const handleDeleteDriver = (driver: Driver) => {
    setDriverToDelete(driver);
  };

  const handleConfirmDelete = async () => {
    if (!driverToDelete) return;
    try {
      await deleteDriver(driverToDelete.id).unwrap();
      setDriverToDelete(null);
    } catch {
      // Error handled in RTK Query / notification state
    }
  };

  return (
    <section className="users-page" aria-labelledby="driver-management-title">
      <header className="users-page__header">
        <div className="page-heading">
          <span className="eyebrow">Fleet Management</span>
          <h1 id="driver-management-title">Driver Management</h1>
          <p>Manage fleet drivers, license details, and operational status.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="users-page__count">
            <strong>{drivers.length}</strong>
            <span>{drivers.length === 1 ? 'driver' : 'drivers'}</span>
          </div>
          <button type="button" className="button button--secondary" onClick={() => navigate('/vehicles')}>
            Vehicles
          </button>
          <button type="button" className="button button--secondary" onClick={() => navigate('/assignments')}>
            Assignments
          </button>
          <button type="button" className="button button--secondary" onClick={() => refetch()}>
            Refresh
          </button>
          <button type="button" className="button button--primary" onClick={handleAddDriver}>
            Add Driver
          </button>
        </div>
      </header>

      {/* Toolbar: Search & Filters */}
      <div className="users-toolbar">
        <div className="users-toolbar__filters">
          <input
            type="text"
            className="toolbar-search"
            placeholder="Search by license or phone..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="ALL">All Statuses</option>
            <option value={DriverStatus.OffDuty}>Off Duty</option>
            <option value={DriverStatus.Available}>Available</option>
            <option value={DriverStatus.OnDuty}>On Duty</option>
            <option value={DriverStatus.OnDelivery}>On Delivery</option>
            <option value={DriverStatus.Suspended}>Suspended</option>
            <option value={DriverStatus.Inactive}>Inactive</option>
          </select>

          {(searchTerm || statusFilter !== 'ALL') && (
            <button
              type="button"
              className="button button--secondary"
              onClick={handleResetFilters}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="details-card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '3rem' }}>
          Loading drivers...
        </div>
      )}

      {isError && (
        <div className="error-message">
          <h3>Failed to Load Drivers</h3>
          <p>
            {error && 'data' in error
              ? (error.data as { message?: string })?.message || 'An error occurred fetching drivers from backend.'
              : 'Unable to connect to backend server. Please verify the API status.'}
          </p>
          <button type="button" className="button button--danger" style={{ marginTop: '0.75rem' }} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <DriverTable
            drivers={paginatedDrivers}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onViewDriver={handleViewDriver}
            onEditDriver={handleEditDriver}
            onDeleteDriver={handleDeleteDriver}
          />

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="pagination-container">
              <span className="pagination-info">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{' '}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} drivers
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="button button--secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <span className="pagination-page">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  className="button button--secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(driverToDelete)}
        title="Delete Driver"
        itemName={driverToDelete ? `License: ${driverToDelete.licenseNumber}` : undefined}
        message="Are you sure you want to delete this driver? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDriverToDelete(null)}
      />
    </section>
  );
};

export default DriverListPage;
