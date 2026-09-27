import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetVehicleByIdQuery, useDeleteVehicleMutation } from '../api/fleetApi';
import { getVehicleStatusInfo } from '../components/VehicleTable';
import { formatDate } from '../components/DriverTable';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { FleetHeader } from '../components/FleetHeader';

export const VehicleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: vehicle, isLoading, isError, error } = useGetVehicleByIdQuery(id!, {
    skip: !id,
  });

  const [deleteVehicle, { isLoading: isDeleting, isError: isDeleteError, error: deleteError }] =
    useDeleteVehicleMutation();

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      await deleteVehicle(id).unwrap();
      setIsDeleteModalOpen(false);
      navigate('/fleet/vehicles');
    } catch {
      // Handled in modal UI state
    }
  };

  if (isLoading) {
    return (
      <section className="users-page">
        <div className="details-card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '3rem' }}>
          Loading vehicle details...
        </div>
      </section>
    );
  }

  if (isError || !vehicle) {
    return (
      <section className="users-page">
        <div className="error-message">
          <h3>Vehicle Not Found</h3>
          <p>
            {error && 'data' in error
              ? (error.data as { message?: string })?.message || 'Vehicle could not be retrieved.'
              : 'The requested vehicle does not exist.'}
          </p>
          <button
            type="button"
            className="button button--secondary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate('/fleet/vehicles')}
          >
            Back to Vehicle List
          </button>
        </div>
      </section>
    );
  }

  const statusInfo = getVehicleStatusInfo(vehicle.status);

  return (
    <section className="users-page">
      <FleetHeader
        title={`Registration #${vehicle.registrationNumber}`}
        subtitle={`${vehicle.make} ${vehicle.model} (${vehicle.vehicleType}) • ${vehicle.capacity} kg Capacity`}
        breadcrumbs={[
          { label: 'Vehicles', path: '/fleet/vehicles' },
          { label: vehicle.registrationNumber },
        ]}
        activeTab="vehicles"
        actionButton={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => navigate(`/fleet/vehicles/${vehicle.id}/edit`)}
            >
              Edit Vehicle
            </button>
            <button
              type="button"
              className="button button--danger"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete Vehicle
            </button>
          </div>
        }
      />

      {isDeleteError && (
        <div className="error-message" style={{ marginTop: '1rem' }}>
          <h3>Delete Failed</h3>
          <p>
            {deleteError && 'data' in deleteError
              ? (deleteError.data as { message?: string })?.message || 'Failed to delete vehicle.'
              : 'Server error deleting vehicle.'}
          </p>
        </div>
      )}

      <div className="details-card" style={{ marginTop: '1.5rem' }}>
        <div className="details-card__identity" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--color-orange-soft)',
              color: 'var(--color-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
            }}
          >
            VH
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{vehicle.registrationNumber}</h2>
            <div style={{ marginTop: '0.25rem' }}>
              <span className={`status-badge ${statusInfo.badgeClass}`}>
                <span className="status-badge__dot" aria-hidden="true" />
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        <dl className="details-grid">
          <div>
            <dt>Registration Number</dt>
            <dd>{vehicle.registrationNumber}</dd>
          </div>
          <div>
            <dt>Vehicle Type</dt>
            <dd>{vehicle.vehicleType}</dd>
          </div>
          <div>
            <dt>Make / Model</dt>
            <dd>{vehicle.make} {vehicle.model}</dd>
          </div>
          <div>
            <dt>Capacity</dt>
            <dd>{vehicle.capacity} kg</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusInfo.label}</dd>
          </div>
          <div>
            <dt>Created At</dt>
            <dd>{formatDate(vehicle.createdAt)}</dd>
          </div>
          <div>
            <dt>Last Updated</dt>
            <dd>{vehicle.updatedAt ? formatDate(vehicle.updatedAt) : 'N/A'}</dd>
          </div>
        </dl>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Vehicle"
        itemName={`Registration: ${vehicle.registrationNumber}`}
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </section>
  );
};

export default VehicleDetailsPage;
