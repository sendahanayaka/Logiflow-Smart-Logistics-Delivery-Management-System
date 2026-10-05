import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiOrderTripPanel } from '../../src/features/fleet/components/MultiOrderTripPanel';
import { TripPreviewCard } from '../../src/features/fleet/components/TripPreviewCard';
import { DispatchOrder } from '../../src/features/orders/types';
import { WorkflowRunResponse } from '../../src/features/fleet/api/agentApi';

// Mock Redux RTK hooks used in fleetApi & agentApi
vi.mock('../../src/features/fleet/api/agentApi', () => ({
  useRunWorkflowMutation: () => [vi.fn().mockImplementation(() => ({ unwrap: vi.fn() })), { isLoading: false }],
  useApproveWorkflowMutation: () => [vi.fn().mockImplementation(() => ({ unwrap: vi.fn() })), { isLoading: false }],
}));

vi.mock('../../src/features/fleet/api/fleetApi', () => ({
  useGetDriversQuery: () => ({ data: [{ id: 'DRV-001', fullName: 'Sunil Perera', licenseNumber: 'B123456', status: 1 }] }),
  useGetVehiclesQuery: () => ({ data: [{ id: 'VEH-001', registrationNumber: 'WP-ABC-5678', make: 'Toyota', model: 'Hiace', capacity: 1500, status: 0 }] }),
  useAssignDriverMutation: () => [vi.fn().mockImplementation(() => ({ unwrap: vi.fn() })), { isLoading: false }],
}));

describe('Multi-Order Trip Allocation UI [Phase 2.5 S2]', () => {
  const mockOrders: DispatchOrder[] = [
    {
      id: 'ORD-101',
      destination: 'Dehiwala',
      weightKg: 200,
      volumeM3: 0.45,
      packagesCount: 2,
      priority: 'HIGH',
      deliveryWindowStart: '08:00 AM',
      deliveryWindowEnd: '12:00 PM',
      status: 'READY',
    },
    {
      id: 'ORD-102',
      destination: 'Mount Lavinia',
      weightKg: 150,
      volumeM3: 0.35,
      packagesCount: 1,
      priority: 'NORMAL',
      deliveryWindowStart: '09:00 AM',
      deliveryWindowEnd: '01:00 PM',
      status: 'READY',
    },
    {
      id: 'ORD-103',
      destination: 'Moratuwa',
      weightKg: 300,
      volumeM3: 0.65,
      packagesCount: 3,
      priority: 'EXPRESS',
      deliveryWindowStart: '08:30 AM',
      deliveryWindowEnd: '11:30 AM',
      status: 'READY',
    },
  ];

  const mockWorkflowResponse: WorkflowRunResponse = {
    workflow_id: 'wf-multi-123456',
    status: 'WAITING_FOR_APPROVAL',
    proposal: {
      allocation: {
        proposed: {
          driver_id: 'DRV-001',
          vehicle_id: 'VEH-001',
          order_ids: ['ORD-101', 'ORD-102', 'ORD-103'],
          total_weight_kg: 650,
          total_volume_m3: 1.45,
          capacity_utilization_percent: 43.3,
          reasons: [
            'Driver Sunil Perera is available and hours check passed',
            'Vehicle WP-ABC-5678 capacity supports 650 kg load',
          ],
          constraints_checked: ['driver_hours', 'vehicle_capacity', 'llm_ranking'],
        },
        alternatives: [
          {
            driver_id: 'DRV-002',
            vehicle_id: 'VEH-002',
            order_ids: ['ORD-101', 'ORD-102', 'ORD-103'],
            total_weight_kg: 650,
            total_volume_m3: 1.45,
            capacity_utilization_percent: 54.2,
            reasons: ['Alternative available vehicle'],
          },
        ],
        compliance_passed: true,
      },
      routing: {
        sequenced_stops: [
          { stop_number: 1, order_id: 'ORD-101', destination: 'Dehiwala', eta: '10:00 AM' },
          { stop_number: 2, order_id: 'ORD-102', destination: 'Mount Lavinia', eta: '10:45 AM' },
          { stop_number: 3, order_id: 'ORD-103', destination: 'Moratuwa', eta: '11:30 AM' },
        ],
        total_distance_km: 18.5,
        total_duration_min: 45,
      },
    },
    audit: [],
    errors: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Renders selection summary with zero orders selected and disables trigger button', () => {
    render(<MultiOrderTripPanel selectedOrders={[]} />);

    expect(screen.getByText('Selected Orders')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /run ai allocation/i });
    expect(button).toBeDisabled();
  });

  it('2. Correctly updates selected order count and calculates total aggregated weight', () => {
    render(<MultiOrderTripPanel selectedOrders={mockOrders} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('650 kg')).toBeInTheDocument();
    expect(screen.getByText('Dehiwala')).toBeInTheDocument();
    expect(screen.getByText('Mount Lavinia')).toBeInTheDocument();
    expect(screen.getByText('Moratuwa')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /run ai allocation/i });
    expect(button).not.toBeDisabled();
  });

  it('3. Renders Trip Preview Card with Driver, Vehicle, Capacity Utilization bar, and Manifest', () => {
    const handleApprove = vi.fn();
    const handleReject = vi.fn();

    render(
      <TripPreviewCard
        workflowResponse={mockWorkflowResponse}
        selectedOrders={mockOrders}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );

    // Driver & Vehicle
    expect(screen.getByText('Sunil Perera')).toBeInTheDocument();
    expect(screen.getByText('WP-ABC-5678')).toBeInTheDocument();

    // Capacity & Utilization
    expect(screen.getByText(/650 kg \/ 1500 kg \(43.3%\)/i)).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '43.3');

    // Trip Manifest Orders
    expect(screen.getByText('ORD-101')).toBeInTheDocument();
    expect(screen.getByText('ORD-102')).toBeInTheDocument();
    expect(screen.getByText('ORD-103')).toBeInTheDocument();

    // Approval Buttons
    expect(screen.getByRole('button', { name: /approve trip/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject trip/i })).toBeInTheDocument();
  });

  it('4. Renders sequenced route stops when returned in routing output', () => {
    render(
      <TripPreviewCard
        workflowResponse={mockWorkflowResponse}
        selectedOrders={mockOrders}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('Route Sequence / Stops Preview')).toBeInTheDocument();
    expect(screen.getAllByText('Dehiwala').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mount Lavinia').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Moratuwa').length).toBeGreaterThan(0);
  });

  it('5. Renders fallback message when route data is not available', () => {
    const noRouteWorkflow: WorkflowRunResponse = {
      ...mockWorkflowResponse,
      proposal: {
        ...mockWorkflowResponse.proposal,
        routing: undefined,
      },
    };

    render(
      <TripPreviewCard
        workflowResponse={noRouteWorkflow}
        selectedOrders={mockOrders}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(
      screen.getByText(/route sequence will be available after routing/i)
    ).toBeInTheDocument();
  });

  it('6. Expands and renders alternative allocations when toggled', () => {
    render(
      <TripPreviewCard
        workflowResponse={mockWorkflowResponse}
        selectedOrders={mockOrders}
        onApprove={vi.fn()}
        onReject={vi.fn()}
      />
    );

    const alternativesToggle = screen.getByRole('button', { name: /alternative allocation candidates/i });
    expect(alternativesToggle).toBeInTheDocument();

    fireEvent.click(alternativesToggle);
    expect(screen.getByText('Alternative Candidate 1')).toBeInTheDocument();
    expect(screen.getByText(/DRV-002/i)).toBeInTheDocument();
    expect(screen.getByText(/VEH-002/i)).toBeInTheDocument();
  });

  it('7. Calls onApprove handler when Approve Trip button is clicked', () => {
    const handleApprove = vi.fn();
    render(
      <TripPreviewCard
        workflowResponse={mockWorkflowResponse}
        selectedOrders={mockOrders}
        onApprove={handleApprove}
        onReject={vi.fn()}
      />
    );

    const approveButton = screen.getByRole('button', { name: /approve trip/i });
    fireEvent.click(approveButton);
    expect(handleApprove).toHaveBeenCalledTimes(1);
  });
});
