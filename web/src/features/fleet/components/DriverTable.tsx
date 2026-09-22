import React from 'react';
import { Driver, DriverStatus } from '../types';

export type SortField = 'licenseNumber' | 'licenseExpiryDate' | 'status';
export type SortDirection = 'asc' | 'desc';

interface DriverTableProps {
  drivers: Driver[];
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  onViewDriver?: (driver: Driver) => void;
  onEditDriver?: (driver: Driver) => void;
  onDeleteDriver?: (driver: Driver) => void;
}

export const getDriverStatusInfo = (status: DriverStatus): { label: string; badgeClass: string } => {
  switch (status) {
    case DriverStatus.Available:
      return { label: 'Available', badgeClass: 'status-badge--available' };
    case DriverStatus.OffDuty:
      return { label: 'Off Duty', badgeClass: 'status-badge--offduty' };
    case DriverStatus.OnDuty:
      return { label: 'On Duty', badgeClass: 'status-badge--onduty' };
    case DriverStatus.OnDelivery:
      return { label: 'On Delivery', badgeClass: 'status-badge--ondelivery' };
    case DriverStatus.Suspended:
      return { label: 'Suspended', badgeClass: 'status-badge--suspended' };
    case DriverStatus.Inactive:
      return { label: 'Inactive', badgeClass: 'status-badge--inactive' };
    default:
      return { label: 'Unknown', badgeClass: 'status-badge--inactive' };
  }
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
};

export const DriverTable: React.FC<DriverTableProps> = ({
  drivers,
  sortField,
  sortDirection,
  onSort,
  onViewDriver,
  onEditDriver,
  onDeleteDriver,
}) => {
  const renderSortHeader = (label: string, field: SortField) => {
    const isActive = sortField === field;
    return (
      <th
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => onSort?.(field)}
        aria-sort={isActive ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>{label}</span>
          <span style={{ fontSize: '0.75rem', opacity: isActive ? 1 : 0.4 }}>
            {isActive ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {renderSortHeader('License Number', 'licenseNumber')}
            <th>Phone Number</th>
            {renderSortHeader('License Expiry', 'licenseExpiryDate')}
            {renderSortHeader('Status', 'status')}
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {drivers.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                No drivers found.
              </td>
            </tr>
          ) : (
            drivers.map((driver) => {
              const statusInfo = getDriverStatusInfo(driver.status);
              return (
                <tr key={driver.id}>
                  <td>
                    <strong>{driver.licenseNumber}</strong>
                  </td>
                  <td>{driver.phoneNumber || 'N/A'}</td>
                  <td>{formatDate(driver.licenseExpiryDate)}</td>
                  <td>
                    <span className={`status-badge ${statusInfo.badgeClass}`}>
                      <span className="status-badge__dot" aria-hidden="true" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="button button--secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => onViewDriver?.(driver)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => onEditDriver?.(driver)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button--danger"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => onDeleteDriver?.(driver)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DriverTable;
