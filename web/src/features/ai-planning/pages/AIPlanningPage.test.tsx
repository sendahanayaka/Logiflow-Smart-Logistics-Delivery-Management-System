import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIPlanningPage } from './AIPlanningPage';

globalThis.fetch = vi.fn() as any;

describe('AIPlanningPage', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn() as any;
        vi.resetAllMocks();
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    const mockResponse = {
        workflow_id: 'wf-123',
        status: 'PLANNING',
        triage: {
            workflow_id: 'wf-123',
            validated_order_ids: ['ord-1', 'ord-2'],
            priority_class: 'HIGH',
            special_handling_flags: ['fragile'],
            plan: [
                {
                    step: 'allocate',
                    agent: 'allocation',
                    description: 'Assign driver'
                }
            ],
            ambiguities: ['Customer said maybe delay']
        }
    };

    it('renders the initial state correctly', () => {
        render(<AIPlanningPage />);
        expect(screen.getByText('🤖 AI Delivery Planning')).toBeInTheDocument();
        expect(screen.getByText('Enter an order to view its AI Delivery Planning Result.')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. wf-12345')).toBeInTheDocument();
    });

    it('handles loading state during fetch', async () => {
        (globalThis.fetch as any).mockImplementationOnce(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(<AIPlanningPage />);
        const input = screen.getByPlaceholderText('e.g. wf-12345');
        fireEvent.change(input, { target: { value: 'wf-123' } });

        const fetchButton = screen.getByText('Fetch Generated Plan');
        fireEvent.click(fetchButton);

        expect(screen.getByText('AI is generating the delivery plan...')).toBeInTheDocument();
    });

    it('displays successful real response mapping and placeholders correctly', async () => {
        (globalThis.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });

        render(<AIPlanningPage />);
        const input = screen.getByPlaceholderText('e.g. wf-12345');
        fireEvent.change(input, { target: { value: 'wf-123' } });

        const fetchButton = screen.getByText('Fetch Generated Plan');
        fireEvent.click(fetchButton);

        await waitFor(() => {
            // Check real data (Category 1)
            expect(screen.getByText('HIGH')).toBeInTheDocument();
            expect(screen.getByText('Customer said maybe delay')).toBeInTheDocument();
            expect(screen.getByText(/Assign driver/i)).toBeInTheDocument();

            // Check specific Handling Requirement in Order Analysis
            const handlingReq = screen.getByTestId('handling-requirement');
            expect(handlingReq).toHaveTextContent('fragile');

            // Check sections
            expect(screen.getByText('ORDER ANALYSIS')).toBeInTheDocument();
            expect(screen.getByText('VEHICLE RECOMMENDATION')).toBeInTheDocument();
            expect(screen.getByText('DELIVERY ESTIMATE')).toBeInTheDocument();
            expect(screen.getByText('HANDLING & RISK')).toBeInTheDocument();
            expect(screen.getByText('AI PLANNING RECOMMENDATION')).toBeInTheDocument();
            expect(screen.getByText('WORKFLOW')).toBeInTheDocument();

            // Check future placeholders (Category 2)
            expect(screen.getAllByText('[Calculated later]').length).toBeGreaterThan(0);
            expect(screen.getAllByText('[Available after integration/calculation]').length).toBeGreaterThan(0);
            expect(screen.getAllByText('[Pending calculation/integration]').length).toBeGreaterThan(0);
        });
    });

    it('handles API error state', async () => {
        (globalThis.fetch as any).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Cannot find workflow' })
        });

        render(<AIPlanningPage />);
        const input = screen.getByPlaceholderText('e.g. wf-12345');
        fireEvent.change(input, { target: { value: 'wf-123' } });

        const fetchButton = screen.getByText('Fetch Generated Plan');
        fireEvent.click(fetchButton);

        await waitFor(() => {
            expect(screen.getByText('Unable to generate delivery plan.')).toBeInTheDocument();
        });
    });
});
