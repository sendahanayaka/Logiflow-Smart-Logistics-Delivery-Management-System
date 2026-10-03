import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OrderSuccessPage } from '../../src/features/orders/pages/OrderSuccessPage';
import { getOrderById } from '../../src/features/orders/ordersApi';
import { DeliveryOrderResponse } from '../../src/features/orders/types';

vi.mock('../../src/features/orders/ordersApi', () => ({
    getOrderById: vi.fn()
}));

const mockOrder: DeliveryOrderResponse = {
    id: 'ord-1234567890-test',
    customerId: 'cust-1',
    pickupAddress: 'Pickup Addr',
    pickupCity: 'City A',
    deliveryAddress: 'Drop Addr',
    deliveryCity: 'City B',
    packageDescription: 'Electronics',
    preferredPickupDate: '2030-01-01T00:00:00Z',
    preferredPickupTime: '10:00',
    priority: 'Express',
    specialHandling: 'Fragile',
    weightKg: 10,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 10,
    status: 'Confirmed',
    createdAt: '2030-01-01T00:00:00Z',
    paymentMethod: 'Card Payment',
    pricing: {
        baseFee: 300,
        distanceCharge: 50,
        weightCharge: 200,
        volumeCharge: 0,
        priorityCharge: 150,
        handlingCharge: 50,
        totalDeliveryFee: 750
    }
};

describe('OrderSuccessPage Component', () => {

    it('renders the successful order state, ID, details, fee and payment method', async () => {
        (getOrderById as any).mockResolvedValue(mockOrder);
        render(
            <MemoryRouter initialEntries={['/orders/ord-1234567890-test/success']}>
                <Routes>
                    <Route path="/orders/:id/success" element={<OrderSuccessPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait to load
        expect(await screen.findByText('Order Placed Successfully!')).toBeInTheDocument();

        // Assert ID is displayed (truncated correctly)
        expect(screen.getByText(/#ORD-1234/i)).toBeInTheDocument();

        // Location Info
        expect(screen.getByText((content) => content.includes('City A'))).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('City B'))).toBeInTheDocument();

        // Package Info
        expect(screen.getByText('Electronics')).toBeInTheDocument();
        expect(screen.getByText(/Express/i)).toBeInTheDocument();
        expect(screen.getByText(/Fragile/i)).toBeInTheDocument();

        // Payment Info
        expect(screen.getByText('Card Payment')).toBeInTheDocument();
        expect(screen.getByText('Rs. 750')).toBeInTheDocument();

        // Nav Buttons
        expect(screen.getByRole('button', { name: /View Order Details/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Create Another Delivery/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Back to My Orders/i })).toBeInTheDocument();
    });
});
