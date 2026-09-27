import React from 'react';
import { DutyScheduleResponse, DutyScheduleStatus } from '../types';

interface DutyScheduleTableProps {
  schedules: DutyScheduleResponse[];
  onEdit: (schedule: DutyScheduleResponse) => void;
  onDelete: (schedule: DutyScheduleResponse) => void;
}

export const DutyScheduleTable: React.FC<DutyScheduleTableProps> = ({
  schedules,
  onEdit,
  onDelete,
}) => {
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const renderStatusBadge = (status: DutyScheduleStatus) => {
    let badgeClass = 'status-badge--offduty';
    let label = 'Scheduled';

    switch (status) {
      case DutyScheduleStatus.Scheduled:
        badgeClass = 'status-badge--available';
        label = 'Scheduled';
        break;
      case DutyScheduleStatus.Active:
        badgeClass = 'status-badge--onduty';
        label = 'Active Shift';
        break;
      case DutyScheduleStatus.Completed:
        badgeClass = 'status-badge--inactive';
        label = 'Completed';
        break;
      case DutyScheduleStatus.Cancelled:
        badgeClass = 'status-badge--suspended';
        label = 'Cancelled';
        break;
    }

    return (
      <span className={`status-badge ${badgeClass}`}>
        <span className="status-badge__dot" />
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Driver Name</th>
            <th>Shift Start Time</th>
            <th>Shift End Time</th>
            <th>Status</th>
            <th>Notes / Details</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <td>
                <strong style={{ color: '#0f172a' }}>{schedule.driverName || 'Driver'}</strong>
              </td>
              <td style={{ fontWeight: 600 }}>{formatDateTime(schedule.startTime)}</td>
              <td style={{ fontWeight: 600 }}>{formatDateTime(schedule.endTime)}</td>
              <td>{renderStatusBadge(schedule.status)}</td>
              <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {schedule.notes || 'No notes specified'}
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="button button--secondary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => onEdit(schedule)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button--danger"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => onDelete(schedule)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
