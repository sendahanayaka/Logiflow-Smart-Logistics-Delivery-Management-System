import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { FleetHeader } from '../../src/features/fleet/components/FleetHeader';
import { FleetLandingPage } from '../../src/features/fleet/pages/FleetLandingPage';

// Mock fleetApi RTK Query hooks
vi.mock('../../src/features/fleet/api/fleetApi', () => ({
  useGetDriversQuery: () => ({ data: [{ id: 'drv-1', fullName: 'Kamal Perera', licenseNumber: 'B1234567', status: 1 }] }),
  useGetVehiclesQuery: () => ({ data: [{ id: 'veh-1', registrationNumber: 'WP-ABC-1234', vehicleType: 'Van', make: 'Toyota', model: 'Hiace', capacity: 1500, status: 0 }] }),
  useGetActiveAssignmentsQuery: () => ({ data: [] }),
  useGetAssignmentHistoryQuery: () => ({ data: [] }),
  useAssignDriverMutation: () => [vi.fn(), { isLoading: false }],
  useEndAssignmentMutation: () => [vi.fn(), { isLoading: false }],
}));

describe('Fleet Management UI 3-Page Navigation Restructuring [S2]', () => {
  it('1. Renders FleetHeader with breadcrumbs, title, and sub-navigation tabs', () => {
    render(
      <MemoryRouter initialEntries={['/fleet/drivers']}>
        <FleetHeader
          title="Driver Management"
          subtitle="Manage drivers, availability and licensing information."
          breadcrumbs={[{ label: 'Drivers' }]}
          activeTab="drivers"
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Driver Management')).toBeInTheDocument();
    expect(screen.getByText('Manage drivers, availability and licensing information.')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByRole('tab', { name: /drivers/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /vehicles/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /assignments/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /duty schedules/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /maintenance/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /multi-order trips/i })).toHaveAttribute('aria-selected', 'false');
  });

  it('2. Correctly highlights active Vehicles tab when navigating to Vehicles page', () => {
    render(
      <MemoryRouter initialEntries={['/fleet/vehicles']}>
        <FleetHeader
          title="Vehicle Management"
          subtitle="Manage fleet vehicles, capacity and operational status."
          breadcrumbs={[{ label: 'Vehicles' }]}
          activeTab="vehicles"
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: /drivers/i })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: /vehicles/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('3. Correctly highlights active Assignments tab when navigating to Assignments page', () => {
    render(
      <MemoryRouter initialEntries={['/fleet/assignments']}>
        <FleetHeader
          title="Driver & Vehicle Assignments"
          subtitle="Manage active driver-vehicle assignments and assignment history."
          breadcrumbs={[{ label: 'Assignments' }]}
          activeTab="assignments"
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('tab', { name: /assignments/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('4. Renders Fleet Management Landing Hub at /fleet with navigation cards', () => {
    render(
      <MemoryRouter initialEntries={['/fleet']}>
        <FleetLandingPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Fleet Management Hub')).toBeInTheDocument();
    expect(screen.getByText('Drivers Management')).toBeInTheDocument();
    expect(screen.getByText('Vehicles Management')).toBeInTheDocument();
    expect(screen.getByText('Assignments Management')).toBeInTheDocument();
    expect(screen.getAllByText('Duty Schedules').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Maintenance Records').length).toBeGreaterThan(0);
    expect(screen.getByText('Multi-Order AI Trips')).toBeInTheDocument();

    // Check card buttons
    expect(screen.getByRole('button', { name: /view drivers roster/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view vehicles list/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage assignments/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage schedules/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage maintenance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create multi-order trip/i })).toBeInTheDocument();
  });
});
