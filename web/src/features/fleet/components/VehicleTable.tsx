import React from 'react';
import { Vehicle, VehicleStatus } from '../types';

export type VehicleSortField = 'registrationNumber' | 'vehicleType' | 'capacity' | 'status';
export type VehicleSortDirection = 'asc' | 'desc';

interface VehicleTableProps {
  vehicles: Vehicle[];
  sortField?: VehicleSortField;
  sortDirection?: VehicleSortDirection;
  onSort?: (field: VehicleSortField) => void;
  onViewVehicle?: (vehicle: Vehicle) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (vehicle: Vehicle) => void;
}

export const getVehicleStatusInfo = (status: VehicleStatus): { label: string; badgeClass: string } => {
  switch (status) {
    case VehicleStatus.Available:
      return { label: 'Available', badgeClass: 'status-badge--available' };
    case VehicleStatus.InTransit:
      return { label: 'In Transit', badgeClass: 'status-badge--intransit' };
    case VehicleStatus.InMaintenance:
      return { label: 'In Maintenance', badgeClass: 'status-badge--inmaintenance' };
    case VehicleStatus.OutOfService:
      return { label: 'Out Of Service', badgeClass: 'status-badge--outofservice' };
    case VehicleStatus.Decommissioned:
      return { label: 'Decommissioned', badgeClass: 'status-badge--decommissioned' };
    default:
      return { label: 'Unknown', badgeClass: 'status-badge--inactive' };
  }
};

export const VehicleTable: React.FC<VehicleTableProps> = ({
  vehicles,
  sortField,
  sortDirection,
  onSort,
  onViewVehicle,
  onEditVehicle,
  onDeleteVehicle,
}) => {
  const renderSortHeader = (label: string, field: VehicleSortField) => {
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
            {renderSortHeader('Registration Number', 'registrationNumber')}
            {renderSortHeader('Vehicle Type', 'vehicleType')}
            <th>Make</th>
            <th>Model</th>
            {renderSortHeader('Capacity (kg)', 'capacity')}
            {renderSortHeader('Status', 'status')}
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                No vehicles found.
              </td>
            </tr>
          ) : (
            vehicles.map((vehicle) => {
              const statusInfo = getVehicleStatusInfo(vehicle.status);
              return (
                <tr key={vehicle.id}>
                  <td>
                    <strong>{vehicle.registrationNumber}</strong>
                  </td>
                  <td>{vehicle.vehicleType}</td>
                  <td>{vehicle.make}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.capacity} kg</td>
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
                        onClick={() => onViewVehicle?.(vehicle)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="button button--secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => onEditVehicle?.(vehicle)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button--danger"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        onClick={() => onDeleteVehicle?.(vehicle)}
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

export default VehicleTable;
