import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useGetDriverByIdQuery, useDeleteDriverMutation } from '../api/fleetApi';
import { getDriverStatusInfo, formatDate } from '../components/DriverTable';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const DriverDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: driver, isLoading, isError, error } = useGetDriverByIdQuery(id!, {
    skip: !id,
  });

  const [deleteDriver, { isLoading: isDeleting, isError: isDeleteError, error: deleteError }] =
    useDeleteDriverMutation();

  const handleDeleteConfirm = async () => {
    if (!id) return;
    try {
      await deleteDriver(id).unwrap();
      setIsDeleteModalOpen(false);
      navigate('/drivers');
    } catch {
      // Handled in modal UI state
    }
  };

  if (isLoading) {
    return (
      <section className="users-page">
        <div className="details-card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '3rem' }}>
          Loading driver details...
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
              ? (error.data as { message?: string })?.message || 'Driver could not be retrieved.'
              : 'The requested driver does not exist.'}
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

  const statusInfo = getDriverStatusInfo(driver.status);

  return (
    <section className="users-page">
      <Link to="/drivers" className="back-link">
        &larr; Back to Driver List
      </Link>

      <header className="detail-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="eyebrow">Driver Details</span>
          <h1 style={{ margin: '0.25rem 0 0.5rem' }}>{driver.fullName || `License #${driver.licenseNumber}`}</h1>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>
            License #{driver.licenseNumber} • Created on {formatDate(driver.createdAt)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => navigate(`/drivers/${driver.id}/edit`)}
          >
            Edit Driver
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            Delete Driver
          </button>
        </div>
      </header>

      {isDeleteError && (
        <div className="error-message" style={{ marginTop: '1rem' }}>
          <h3>Delete Failed</h3>
          <p>
            {deleteError && 'data' in deleteError
              ? (deleteError.data as { message?: string })?.message || 'Failed to delete driver.'
              : 'Server error deleting driver.'}
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
            {driver.fullName
              ? driver.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'DR'}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{driver.fullName || `License: ${driver.licenseNumber}`}</h2>
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
            <dt>Full Name</dt>
            <dd><strong>{driver.fullName || 'N/A'}</strong></dd>
          </div>
          <div>
            <dt>License Number</dt>
            <dd>{driver.licenseNumber}</dd>
          </div>
          <div>
            <dt>License Expiry Date</dt>
            <dd>{formatDate(driver.licenseExpiryDate)}</dd>
          </div>
          <div>
            <dt>Phone Number</dt>
            <dd>{driver.phoneNumber || 'N/A'}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{statusInfo.label}</dd>
          </div>
          <div>
            <dt>System User ID</dt>
            <dd>{driver.userId || 'Unlinked'}</dd>
          </div>
          <div>
            <dt>Created At</dt>
            <dd>{formatDate(driver.createdAt)}</dd>
          </div>
          <div>
            <dt>Last Updated</dt>
            <dd>{driver.updatedAt ? formatDate(driver.updatedAt) : 'N/A'}</dd>
          </div>
        </dl>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Driver"
        itemName={driver.fullName ? `${driver.fullName} (${driver.licenseNumber})` : `License: ${driver.licenseNumber}`}
        message="Are you sure you want to delete this driver? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </section>
  );
};

export default DriverDetailsPage;
