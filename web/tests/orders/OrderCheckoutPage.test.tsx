import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OrderCheckoutPage } from '../../src/features/orders/pages/OrderCheckoutPage';
import { getOrderById } from '../../src/features/orders/ordersApi';
import { DeliveryOrderResponse } from '../../src/features/orders/types';

vi.mock('../../src/features/orders/ordersApi', () => ({
    getOrderById: vi.fn()
}));

const mockOrder: DeliveryOrderResponse = {
    id: 'ord-123',
    customerId: 'cust-1',
    pickupAddress: 'Pickup',
    pickupCity: 'City A',
    deliveryAddress: 'Del',
    deliveryCity: 'City B',
    packageDescription: 'Desc',
    preferredPickupDate: '2030-01-01T00:00:00Z',
    preferredPickupTime: '10:00',
    priority: 'Standard',
    weightKg: 10,
    lengthCm: 10,
    widthCm: 10,
    heightCm: 10,
    status: 'Pending',
    createdAt: '2030-01-01T00:00:00Z',
    pricing: {
        baseFee: 300,
        distanceCharge: 50,
        weightCharge: 200,
        volumeCharge: 0,
        priorityCharge: 0,
        handlingCharge: 0,
        totalDeliveryFee: 550
    }
};

describe('OrderCheckoutPage Validation', () => {

    it('requires a payment method to be selected', async () => {
        (getOrderById as any).mockResolvedValue(mockOrder);
        render(
            <MemoryRouter initialEntries={['/orders/ord-123/checkout']}>
                <Routes>
                    <Route path="/orders/:id/checkout" element={<OrderCheckoutPage />} />
                </Routes>
            </MemoryRouter>
        );

        // Wait to load
        expect(await screen.findByText('DELIVERY PRICING')).toBeInTheDocument();

        // Assert confirm button is disabled when payment is empty
        const confirmBtn = screen.getByRole('button', { name: /Confirm Order & Pay/i });
        expect(confirmBtn).toBeDisabled();
    });

    it('allows Cash on Pickup and successfully confirms', async () => {
        (getOrderById as any).mockResolvedValue(mockOrder);
        render(
            <MemoryRouter initialEntries={['/orders/ord-123/checkout']}>
                <Routes>
                    <Route path="/orders/:id/checkout" element={<OrderCheckoutPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText('DELIVERY PRICING')).toBeInTheDocument();

        // Select Cash on Pickup
        fireEvent.click(screen.getByText('Cash on Pickup'));

        // Confirm button is instantly enabled because no extra info needed
        const confirmBtn = screen.getByRole('button', { name: /Confirm Order & Pay/i });
        expect(confirmBtn).not.toBeDisabled();
    });

    it('validates Card Payment required fields', async () => {
        (getOrderById as any).mockResolvedValue(mockOrder);
        render(
            <MemoryRouter initialEntries={['/orders/ord-123/checkout']}>
                <Routes>
                    <Route path="/orders/:id/checkout" element={<OrderCheckoutPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText('DELIVERY PRICING')).toBeInTheDocument();

        // Select Card
        fireEvent.click(screen.getByText('Card Payment'));

        const confirmBtn = screen.getByRole('button', { name: /Confirm Order & Pay/i });
        expect(confirmBtn).toBeDisabled();

        // Fill data
        fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Jane' } });
        fireEvent.change(screen.getByPlaceholderText('1234 5678 9101 1121'), { target: { value: '4111222233334444' } });
        fireEvent.change(screen.getByPlaceholderText('12/25'), { target: { value: '11/30' } });

        expect(confirmBtn).toBeDisabled(); // CVV still missing

        fireEvent.change(screen.getByPlaceholderText('123'), { target: { value: '123' } });
        expect(confirmBtn).not.toBeDisabled(); // All fields filled
    });

    it('validates Online Bank Transfer requires receipt', async () => {
        (getOrderById as any).mockResolvedValue(mockOrder);
        render(
            <MemoryRouter initialEntries={['/orders/ord-123/checkout']}>
                <Routes>
                    <Route path="/orders/:id/checkout" element={<OrderCheckoutPage />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText('DELIVERY PRICING')).toBeInTheDocument();

        // Select Bank Transfer
        fireEvent.click(screen.getByText('Online Bank Transfer'));

        const confirmBtn = screen.getByRole('button', { name: /Confirm Order & Pay/i });
        expect(confirmBtn).toBeDisabled();
    });
});
