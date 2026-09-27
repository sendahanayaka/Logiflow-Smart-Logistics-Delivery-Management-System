import React from 'react';
import { MaintenanceRecordResponse, MaintenanceStatus } from '../types';

interface MaintenanceRecordTableProps {
  records: MaintenanceRecordResponse[];
  onEditRecord?: (record: MaintenanceRecordResponse) => void;
  onDeleteRecord?: (record: MaintenanceRecordResponse) => void;
}

export const getMaintenanceStatusBadge = (status: MaintenanceStatus): { label: string; badgeClass: string } => {
  switch (status) {
    case MaintenanceStatus.Scheduled:
      return { label: 'Scheduled', badgeClass: 'status-badge--available' };
    case MaintenanceStatus.InProgress:
      return { label: 'In Progress', badgeClass: 'status-badge--inmaintenance' };
    case MaintenanceStatus.Completed:
      return { label: 'Completed', badgeClass: 'status-badge--active' };
    case MaintenanceStatus.Cancelled:
      return { label: 'Cancelled', badgeClass: 'status-badge--inactive' };
    default:
      return { label: 'Unknown', badgeClass: 'status-badge--inactive' };
  }
};

export const MaintenanceRecordTable: React.FC<MaintenanceRecordTableProps> = ({
  records,
  onEditRecord,
  onDeleteRecord,
}) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Maintenance Type</th>
            <th>Maintenance Date</th>
            <th>Cost</th>
            <th>Next Due Date</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                No maintenance records found.
              </td>
            </tr>
          ) : (
            records.map((record) => {
              const statusInfo = getMaintenanceStatusBadge(record.status);
              return (
                <tr key={record.id}>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{record.vehicleRegistrationNumber || 'Unknown Vehicle'}</strong>
                  </td>
                  <td>
                    <div>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{record.maintenanceType}</span>
                      {record.description && (
                        <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748b', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {record.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>{formatDate(record.maintenanceDate)}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      ${record.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td>{formatDateShort(record.nextMaintenanceDate)}</td>
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
                        onClick={() => onEditRecord?.(record)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button--danger"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => onDeleteRecord?.(record)}
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
