import React from 'react';
import { Vehicle } from '../types';
import { useGetVehicleMaintenanceStatusQuery } from '../api/fleetApi';

interface MaintenanceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
}

export const MaintenanceStatusModal: React.FC<MaintenanceStatusModalProps> = ({
  isOpen,
  onClose,
  vehicle,
}) => {
  if (!isOpen || !vehicle) return null;

  const { data: statusData, isLoading, isError, refetch } = useGetVehicleMaintenanceStatusQuery(vehicle.id);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not scheduled / N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              ⚡
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                Vehicle Maintenance Status Check
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                Operational check for vehicle asset allocation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </header>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: '#f1f5f9' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
              Vehicle Information
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
              {vehicle.registrationNumber}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              {vehicle.make} {vehicle.model} • {vehicle.vehicleType} ({vehicle.capacity} kg)
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              Evaluating vehicle maintenance status...
            </div>
          ) : isError ? (
            <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#991b1b', textAlign: 'center' }}>
              Failed to fetch vehicle maintenance status.
              <button
                type="button"
                onClick={() => refetch()}
                style={{ display: 'block', margin: '0.5rem auto 0 auto', padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid #991b1b', background: 'transparent', cursor: 'pointer', color: '#991b1b', fontWeight: 600 }}
              >
                Retry
              </button>
            </div>
          ) : statusData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `1px solid ${statusData.currentlyInMaintenance ? '#fca5a5' : '#bbf7d0'}`,
                    backgroundColor: statusData.currentlyInMaintenance ? '#fef2f2' : '#f0fdf4',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: statusData.currentlyInMaintenance ? '#991b1b' : '#166534', fontWeight: 600 }}>
                    In Maintenance Status
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: statusData.currentlyInMaintenance ? '#dc2626' : '#16a34a', marginTop: '0.25rem' }}>
                    {statusData.currentlyInMaintenance ? '⚠️ YES (Active)' : '✅ NO (Operational)'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `1px solid ${statusData.maintenanceDue ? '#fed7aa' : '#bbf7d0'}`,
                    backgroundColor: statusData.maintenanceDue ? '#fff7ed' : '#f0fdf4',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: statusData.maintenanceDue ? '#9a3412' : '#166534', fontWeight: 600 }}>
                    Maintenance Due
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: statusData.maintenanceDue ? '#ea580c' : '#16a34a', marginTop: '0.25rem' }}>
                    {statusData.maintenanceDue ? '⚠️ Maintenance Due' : '✅ Up to Date'}
                  </div>
                </div>
              </div>

              <div style={{ borderRadius: '8px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fafafa' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Latest Maintenance Performed:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{formatDate(statusData.latestMaintenanceDate)}</strong>
                </div>
                <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Next Scheduled Maintenance:</span>
                  <strong style={{ fontSize: '0.85rem', color: statusData.maintenanceDue ? '#ea580c' : '#0f172a' }}>
                    {formatDate(statusData.nextMaintenanceDate)}
                  </strong>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <footer
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#f8fafc',
          }}
        >
          <button type="button" className="button button--secondary" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};
