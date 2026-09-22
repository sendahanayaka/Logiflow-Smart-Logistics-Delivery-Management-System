import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetVehiclesQuery, useDeleteVehicleMutation } from '../api/fleetApi';
import { VehicleTable, VehicleSortField, VehicleSortDirection } from '../components/VehicleTable';
import { Vehicle, VehicleStatus } from '../types';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const VehicleListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: vehicles = [], isLoading, isError, error, refetch } = useGetVehiclesQuery();
  const [deleteVehicle, { isLoading: isDeleting }] = useDeleteVehicleMutation();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Sorting State
  const [sortField, setSortField] = useState<VehicleSortField>('registrationNumber');
  const [sortDirection, setSortDirection] = useState<VehicleSortDirection>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete Modal State
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

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
    setSortField('registrationNumber');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  // Sort Handler
  const handleSort = (field: VehicleSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtering Logic
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        vehicle.registrationNumber.toLowerCase().includes(term) ||
        vehicle.vehicleType.toLowerCase().includes(term) ||
        vehicle.make.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'ALL' || vehicle.status === Number(statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  // Sorting Logic
  const sortedVehicles = useMemo(() => {
    return [...filteredVehicles].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'registrationNumber') {
        comparison = a.registrationNumber.localeCompare(b.registrationNumber);
      } else if (sortField === 'vehicleType') {
        comparison = a.vehicleType.localeCompare(b.vehicleType);
      } else if (sortField === 'capacity') {
        comparison = a.capacity - b.capacity;
      } else if (sortField === 'status') {
        comparison = a.status - b.status;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredVehicles, sortField, sortDirection]);

  // Pagination Logic
  const totalItems = sortedVehicles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedVehicles.slice(start, start + pageSize);
  }, [sortedVehicles, currentPage, pageSize]);

  // Action Handlers
  const handleAddVehicle = () => {
    navigate('/vehicles/new');
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    navigate(`/vehicles/${vehicle.id}/edit`);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      await deleteVehicle(vehicleToDelete.id).unwrap();
      setVehicleToDelete(null);
    } catch {
      // Handled in RTK Query / notification state
    }
  };

  return (
    <section className="users-page" aria-labelledby="vehicle-management-title">
      <header className="users-page__header">
        <div className="page-heading">
          <span className="eyebrow">Fleet Management</span>
          <h1 id="vehicle-management-title">Vehicle Management</h1>
          <p>Manage fleet vehicles, specifications, capacity, and operational status.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="users-page__count">
            <strong>{vehicles.length}</strong>
            <span>{vehicles.length === 1 ? 'vehicle' : 'vehicles'}</span>
          </div>
          <button type="button" className="button button--secondary" onClick={() => navigate('/drivers')}>
            Drivers
          </button>
          <button type="button" className="button button--secondary" onClick={() => navigate('/assignments')}>
            Assignments
          </button>
          <button type="button" className="button button--secondary" onClick={() => refetch()}>
            Refresh
          </button>
          <button type="button" className="button button--primary" onClick={handleAddVehicle}>
            Add Vehicle
          </button>
        </div>
      </header>

      {/* Toolbar: Search & Filters */}
      <div className="users-toolbar">
        <div className="users-toolbar__filters">
          <input
            type="text"
            className="toolbar-search"
            placeholder="Search by reg, type, make, model..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="ALL">All Statuses</option>
            <option value={VehicleStatus.Available}>Available</option>
            <option value={VehicleStatus.InTransit}>In Transit</option>
            <option value={VehicleStatus.InMaintenance}>In Maintenance</option>
            <option value={VehicleStatus.OutOfService}>Out of Service</option>
            <option value={VehicleStatus.Decommissioned}>Decommissioned</option>
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
          Loading vehicles...
        </div>
      )}

      {isError && (
        <div className="error-message">
          <h3>Failed to Load Vehicles</h3>
          <p>
            {error && 'data' in error
              ? (error.data as { message?: string })?.message || 'An error occurred fetching vehicles from backend.'
              : 'Unable to connect to backend server. Please verify the API status.'}
          </p>
          <button type="button" className="button button--danger" style={{ marginTop: '0.75rem' }} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <VehicleTable
            vehicles={paginatedVehicles}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onViewVehicle={handleViewVehicle}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="pagination-container">
              <span className="pagination-info">
                Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{' '}
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems} vehicles
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
        isOpen={Boolean(vehicleToDelete)}
        title="Delete Vehicle"
        itemName={vehicleToDelete ? `Registration: ${vehicleToDelete.registrationNumber}` : undefined}
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setVehicleToDelete(null)}
      />
    </section>
  );
};

export default VehicleListPage;
