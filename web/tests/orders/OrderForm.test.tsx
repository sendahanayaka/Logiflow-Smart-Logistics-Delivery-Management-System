import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { OrderForm } from '../../src/features/orders/components/OrderForm';

describe('OrderForm Components', () => {
    it('1. NORMAL / SUCCESS CASE: renders required fields, accepts input, and calls onSubmit with correct data', async () => {
        const user = userEvent.setup();
        const mockSubmit = vi.fn();
        render(<OrderForm onSubmit={mockSubmit} isLoading={false} />);

        // Enable button by filling required fields (Pickup City and Delivery City)
        await user.type(screen.getByLabelText(/Pickup City \*/i), 'Colombo');
        await user.type(screen.getByLabelText(/Delivery City \*/i), 'Kandy');
        await user.type(screen.getByLabelText(/Pickup Address \*/i), '123 Test Rd');
        await user.type(screen.getByLabelText(/Delivery Address \*/i), '456 Delivery Ave');
        await user.type(screen.getByLabelText(/Package Description \*/i), 'Electronics');

        // Verify the predefined defaults
        const weightInput = screen.getByLabelText(/Weight \(kg\) \*/i);
        expect(weightInput).toHaveValue(1);

        const submitBtn = screen.getByRole('button', { name: /Calculate Fee & Proceed to Checkout/i });
        expect(submitBtn).toBeEnabled();

        // Submit form
        await user.click(submitBtn);

        // Assert submission payload
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const payload = mockSubmit.mock.calls[0][0];

        expect(payload.pickupCity).toBe('Colombo');
        expect(payload.deliveryCity).toBe('Kandy');
        expect(payload.pickupAddress).toBe('123 Test Rd');
        expect(payload.deliveryAddress).toBe('456 Delivery Ave');
        expect(payload.packageDescription).toBe('Electronics');

        // Assert date time transformations
        expect(payload.preferredPickupDate).toContain('T00:00:00Z');
    });

    it('2. INVALID / VALIDATION CASE: submit button is disabled when required fields are missing', async () => {
        const user = userEvent.setup();
        const mockSubmit = vi.fn();
        render(<OrderForm onSubmit={mockSubmit} isLoading={false} />);

        const submitBtn = screen.getByRole('button', { name: /Calculate Fee & Proceed to Checkout/i });

        // Initially empty, button should be disabled
        expect(submitBtn).toBeDisabled();

        // Fill one required field (Pickup City)
        const pickupCityInput = screen.getByLabelText(/Pickup City \*/i);
        await user.type(pickupCityInput, 'Colombo');

        // Still disabled because Delivery City is missing
        expect(submitBtn).toBeDisabled();

        // Fill second required field
        const deliveryCityInput = screen.getByLabelText(/Delivery City \*/i);
        await user.type(deliveryCityInput, 'Kandy');

        // Now expected to be enabled
        expect(submitBtn).toBeEnabled();

        // Clear a required field to verify it reverts to disabled
        await user.clear(pickupCityInput);
        expect(submitBtn).toBeDisabled();
    });

    it('3. INVALID / BOUNDARY CASE: rejects invalid recipient contact on submit', async () => {
        const user = userEvent.setup();
        const mockSubmit = vi.fn();
        render(<OrderForm onSubmit={mockSubmit} isLoading={false} />);

        // Fill fields to ostensibly enable button and pass HTML5 validation
        await user.type(screen.getByLabelText(/Pickup City \*/i), 'Colombo');
        await user.type(screen.getByLabelText(/Delivery City \*/i), 'Kandy');
        await user.type(screen.getByLabelText(/Pickup Address \*/i), '123 Test Rd');
        await user.type(screen.getByLabelText(/Delivery Address \*/i), '456 Delivery Ave');
        await user.type(screen.getByLabelText(/Package Description \*/i), 'Electronics');

        // Fill recipient contact with invalid length < 3
        const contactInput = screen.getByLabelText(/Recipient Contact/i);
        await user.type(contactInput, '12');

        const submitBtn = screen.getByRole('button', { name: /Calculate Fee & Proceed to Checkout/i });
        expect(submitBtn).toBeEnabled();

        // Submit form
        await user.click(submitBtn);

        // Submission should be blocked
        expect(mockSubmit).not.toHaveBeenCalled();

        // Error alert should be displayed
        const errorAlert = await screen.findByText('Recipient contact format is invalid.');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveClass('orders-alert-danger');
    });

    it('4. INVALID / BOUNDARY CASE: rejects zero or negative weight/dimensions and disables submit', async () => {
        const user = userEvent.setup();
        const mockSubmit = vi.fn();
        render(<OrderForm onSubmit={mockSubmit} isLoading={false} />);

        // Fill fields to ostensibly enable button and pass HTML5 validation
        await user.type(screen.getByLabelText(/Pickup City \*/i), 'Colombo');
        await user.type(screen.getByLabelText(/Delivery City \*/i), 'Kandy');
        await user.type(screen.getByLabelText(/Pickup Address \*/i), '123 Test Rd');
        await user.type(screen.getByLabelText(/Delivery Address \*/i), '456 Delivery Ave');
        await user.type(screen.getByLabelText(/Package Description \*/i), 'Electronics');

        const submitBtn = screen.getByRole('button', { name: /Calculate Fee & Proceed to Checkout/i });
        expect(submitBtn).toBeEnabled();

        // Change weight to 0
        const weightInput = screen.getByLabelText(/Weight \(kg\) \*/i);
        await user.clear(weightInput);
        await user.type(weightInput, '0');

        // Submit button should visually disable immediately preventing click
        expect(submitBtn).toBeDisabled();

        // We can force a form submission using fireEvent to test the JS fallback validation behavior
        fireEvent.submit(screen.getByRole('button', { name: /Calculate Fee/i }).closest('form')!);

        // Assert error message exists
        expect(screen.getByText('Weight and all dimensions must be strictly positive.')).toBeInTheDocument();
        expect(mockSubmit).not.toHaveBeenCalled();
    });
});
