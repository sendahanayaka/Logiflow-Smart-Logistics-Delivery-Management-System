import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetVehicleByIdQuery } from '../api/fleetApi';
import { VehicleForm } from '../components/VehicleForm';
import { FleetHeader } from '../components/FleetHeader';

export const VehicleEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: vehicle, isLoading, isError, error } = useGetVehicleByIdQuery(id!, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <section className="users-page">
        <div className="details-card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '3rem' }}>
          Loading vehicle details for editing...
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
              ? (error.data as { message?: string })?.message || 'Failed to load vehicle details.'
              : 'The specified vehicle could not be found.'}
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

  return (
    <section className="users-page">
      <FleetHeader
        title={`Edit Vehicle: ${vehicle.registrationNumber}`}
        subtitle={`Update specifications for ${vehicle.make} ${vehicle.model} (${vehicle.capacity} kg)`}
        breadcrumbs={[
          { label: 'Vehicles', path: '/fleet/vehicles' },
          { label: vehicle.registrationNumber, path: `/fleet/vehicles/${id}` },
          { label: 'Edit' },
        ]}
        activeTab="vehicles"
      />
      <VehicleForm
        isEditMode={true}
        vehicleId={id}
        initialValues={vehicle}
        onCancel={() => navigate(`/fleet/vehicles/${id}`)}
        onSuccess={() => navigate(`/fleet/vehicles/${id}`)}
      />
    </section>
  );
};

export default VehicleEditPage;
