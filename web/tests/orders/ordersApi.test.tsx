import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createOrder, getOrderById } from '../../src/features/orders/ordersApi';
import { API_BASE_URL } from '../../src/app/api';

describe('ordersApi RTK Query / Fetch Integration', () => {

    beforeEach(() => {
        globalThis.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('createOrder executes structurally compliant HTTP POST mapped to correct API endpoint', async () => {
        const mockResponse = { id: 'ord-123', status: 'Pending' };

        (globalThis.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const reqBody = { pickupCity: 'Colombo', weightKg: 10 } as any;

        const res = await createOrder(reqBody);

        expect(res.id).toBe('ord-123');
        expect(res.status).toBe('Pending');

        // Assert the underlying physical route integration
        expect(globalThis.fetch).toHaveBeenCalledWith(
            `${API_BASE_URL}/orders`,
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(reqBody)
            })
        );
    });

    it('getOrderById intercepts and throws server rejection on HTTP 500 Network failure', async () => {
        (globalThis.fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Internal Database Failure' })
        });

        // The custom handleApiError helper extracts message
        await expect(getOrderById('failed-id')).rejects.toThrow('Internal Database Failure');

        // Verify target hitting
        expect(globalThis.fetch).toHaveBeenCalledWith(
            `${API_BASE_URL}/orders/failed-id`,
            expect.any(Object)
        );
    });
});
