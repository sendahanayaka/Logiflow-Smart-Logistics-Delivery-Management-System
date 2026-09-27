import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DriverTable, getDriverStatusInfo } from '../../src/features/fleet/components/DriverTable';
import { Driver, DriverStatus } from '../../src/features/fleet/types';

describe('Fleet Driver Management UI Components [S2]', () => {
  const mockDrivers: Driver[] = [
    {
      id: 'drv-1',
      userId: 'usr-1',
      fullName: 'Kamal Perera',
      licenseNumber: 'B1234567',
      licenseExpiryDate: '2028-12-31T00:00:00.000Z',
      phoneNumber: '0771234567',
      status: DriverStatus.Available,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    },
    {
      id: 'drv-2',
      userId: null,
      fullName: 'Nimal Silva',
      licenseNumber: 'C9876543',
      licenseExpiryDate: '2027-06-15T00:00:00.000Z',
      phoneNumber: '0719876543',
      status: DriverStatus.OnDuty,
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: null,
    },
  ];

  it('renders driver table with driver names, licenses, phone numbers, and statuses', () => {
    render(<DriverTable drivers={mockDrivers} />);

    expect(screen.getByText('Kamal Perera')).toBeInTheDocument();
    expect(screen.getByText('B1234567')).toBeInTheDocument();
    expect(screen.getByText('0771234567')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();

    expect(screen.getByText('Nimal Silva')).toBeInTheDocument();
    expect(screen.getByText('C9876543')).toBeInTheDocument();
    expect(screen.getByText('0719876543')).toBeInTheDocument();
    expect(screen.getByText('On Duty')).toBeInTheDocument();
  });

  it('renders empty state when driver array is empty', () => {
    render(<DriverTable drivers={[]} />);
    expect(screen.getByText('No drivers found.')).toBeInTheDocument();
  });

  it('triggers onViewDriver, onEditDriver, and onDeleteDriver handlers when action buttons are clicked', () => {
    const handleView = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <DriverTable
        drivers={[mockDrivers[0]]}
        onViewDriver={handleView}
        onEditDriver={handleEdit}
        onDeleteDriver={handleDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /view/i }));
    expect(handleView).toHaveBeenCalledWith(mockDrivers[0]);

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(handleEdit).toHaveBeenCalledWith(mockDrivers[0]);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(handleDelete).toHaveBeenCalledWith(mockDrivers[0]);
  });

  it('triggers onSort when sortable table header is clicked', () => {
    const handleSort = vi.fn();
    render(<DriverTable drivers={mockDrivers} onSort={handleSort} sortField="fullName" sortDirection="asc" />);

    fireEvent.click(screen.getByText('Driver Name'));
    expect(handleSort).toHaveBeenCalledWith('fullName');
  });

  it('correctly maps DriverStatus enum values to human-readable status info labels', () => {
    expect(getDriverStatusInfo(DriverStatus.Available).label).toBe('Available');
    expect(getDriverStatusInfo(DriverStatus.OffDuty).label).toBe('Off Duty');
    expect(getDriverStatusInfo(DriverStatus.OnDuty).label).toBe('On Duty');
    expect(getDriverStatusInfo(DriverStatus.OnDelivery).label).toBe('On Delivery');
    expect(getDriverStatusInfo(DriverStatus.Suspended).label).toBe('Suspended');
    expect(getDriverStatusInfo(DriverStatus.Inactive).label).toBe('Inactive');
  });
});
