import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OrderDetailsPage } from '../../src/features/orders/pages/OrderDetailsPage';
import { DeliveryOrderResponse } from '../../src/features/orders/types';

vi.mock('../../src/features/orders/ordersApi', () => ({
    getOrderById: vi.fn(),
    cancelOrder: vi.fn(),
}));

// These tests cover order details and pricing. Tracking has its own tests and
// uses RTK Query, so keep its store/network requirements outside this suite.
vi.mock('../../src/features/delivery/components/OrderTrackingSection', () => ({
    OrderTrackingSection: () => <div data-testid="order-tracking" />,
}));

import { getOrderById } from '../../src/features/orders/ordersApi';

const mockOrder: DeliveryOrderResponse = {
    id: 'ord-123',
    customerId: 'cust-1',
    pickupAddress: 'Pickup Addr',
    pickupCity: 'Pickup City',
    deliveryAddress: 'Del Addr',
    deliveryCity: 'Del City',
    packageDescription: 'Desc',
    preferredPickupDate: '2030-01-01T00:00:00Z',
    preferredPickupTime: '10:00:00',
    priority: 'Standard',
    weightKg: 10,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 10,
    status: 'Pending',
    createdAt: '2030-01-01T00:00:00Z',
    intelligence: {
        volumeM3: 0.001,
        weightClassification: 'Light',
        handlingRequirement: 'None',
        recommendedPriority: 'Standard',
        risksOrAmbiguities: []
    }
};

describe('OrderDetailsPage', () => {

    it('renders Calculating delivery fee when pricing is absent', async () => {
        (getOrderById as any).mockResolvedValueOnce(mockOrder);
        render(
            <MemoryRouter initialEntries={['/orders/ord-123']}>
                <Routes>
                    <Route path="/orders/:id" element={<OrderDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText('Order Details')).toBeInTheDocument();
        expect(screen.getByText('DELIVERY PRICING')).toBeInTheDocument();
        expect(screen.getByText('Calculating...')).toBeInTheDocument();
    });

    it('renders the fee breakdown correctly when pricing is available', async () => {
        const pricedOrder = {
            ...mockOrder,
            pricing: {
                baseFee: 300,
                distanceCharge: 600,
                weightCharge: 200,
                volumeCharge: 50,
                priorityCharge: 0,
                handlingCharge: 0,
                totalDeliveryFee: 1150
            }
        };

        (getOrderById as any).mockResolvedValueOnce(pricedOrder);
        render(
            <MemoryRouter initialEntries={['/orders/ord-123']}>
                <Routes>
                    <Route path="/orders/:id" element={<OrderDetailsPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText('Order Details')).toBeInTheDocument();
        expect(screen.getByText('DELIVERY PRICING')).toBeInTheDocument();
        expect(screen.getByText('Base Fee:')).toBeInTheDocument();

        // Match specific rounded texts 
        expect(screen.getByText('Rs. 300.00')).toBeInTheDocument();
        expect(screen.getByText('Rs. 600.00')).toBeInTheDocument();
        expect(screen.getByText('Rs. 250.00')).toBeInTheDocument();
        expect(screen.getByText('Rs. 0.00')).toBeInTheDocument();
        expect(screen.getByText('Total Fee:')).toBeInTheDocument();
        expect(screen.getByText('Rs. 1,150')).toBeInTheDocument();
    });
});
