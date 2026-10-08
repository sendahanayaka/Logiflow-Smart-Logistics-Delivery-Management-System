import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CustomerOrderListPage } from '../../src/features/orders/pages/OrderListPage';
import * as ordersApi from '../../src/features/orders/ordersApi';

// Mock specific hooks to control UI boundaries independently of the store
vi.mock('../../src/features/orders/ordersApi', () => ({
  useGetMyOrdersQuery: vi.fn(),
  useGetDispatchOrdersQuery: vi.fn()
}));

describe('CustomerOrderListPage - UI State Testing', () => {

  it('renders empty list state correctly when there are no orders', async () => {
    // Mock empty array response
    (ordersApi.useGetMyOrdersQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn()
    });

    render(
      <MemoryRouter>
        <CustomerOrderListPage />
      </MemoryRouter>
    );

    // Verify custom empty state renders correctly
    expect(screen.getByText('No delivery orders yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first delivery order and start tracking it here.')).toBeInTheDocument();

    // There are 2 such buttons in this specific view: one in header, one in empty state
    const createBtns = screen.getAllByRole('button', { name: /Create Delivery Order/i });
    expect(createBtns.length).toBe(2);
  });

  it('renders HTTP 500/API error boundaries accurately', async () => {
    const mockRefetch = vi.fn();

    // Mock server explosion state
    (ordersApi.useGetMyOrdersQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: { data: { message: 'Internal Server Error' } },
      refetch: mockRefetch
    });

    render(
      <MemoryRouter>
        <CustomerOrderListPage />
      </MemoryRouter>
    );

    // Verify error boundaries surfaced
    expect(screen.getByText('Unable to load your orders')).toBeInTheDocument();
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    retryBtn.click();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('displays loading pulsing indicators continuously while fetching', async () => {
    // Mock in-flight request
    (ordersApi.useGetMyOrdersQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn()
    });

    const { container } = render(
      <MemoryRouter>
        <CustomerOrderListPage />
      </MemoryRouter>
    );

    // We expect pulsing layout skeletons, but not the UI grid
    // The skeleton uses inline styles like `animation: 'pulse 1.5s infinite'`
    expect(container.innerHTML).toContain('pulse');
    expect(screen.queryByText('Total Orders')).not.toBeInTheDocument();
  });
});
