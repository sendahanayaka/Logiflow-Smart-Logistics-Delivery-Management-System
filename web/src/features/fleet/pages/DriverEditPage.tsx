import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetDriverByIdQuery } from '../api/fleetApi';
import { DriverForm } from '../components/DriverForm';

export const DriverEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: driver, isLoading, isError, error } = useGetDriverByIdQuery(id!, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <section className="users-page">
        <div className="details-card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '3rem' }}>
          Loading driver details for editing...
        </div>
      </section>
    );
  }

  if (isError || !driver) {
    return (
      <section className="users-page">
        <div className="error-message">
          <h3>Driver Not Found</h3>
          <p>
            {error && 'data' in error
              ? (error.data as { message?: string })?.message || 'Failed to load driver details.'
              : 'The specified driver could not be found.'}
          </p>
          <button
            type="button"
            className="button button--secondary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate('/drivers')}
          >
            Back to Driver List
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="users-page">
      <a
        href={`/drivers/${id}`}
        className="back-link"
        onClick={(e) => {
          e.preventDefault();
          navigate(`/drivers/${id}`);
        }}
      >
        &larr; Back to Driver Details
      </a>
      <DriverForm
        isEditMode={true}
        driverId={id}
        initialValues={driver}
        onCancel={() => navigate(`/drivers/${id}`)}
        onSuccess={() => navigate(`/drivers/${id}`)}
      />
    </section>
  );
};

export default DriverEditPage;
