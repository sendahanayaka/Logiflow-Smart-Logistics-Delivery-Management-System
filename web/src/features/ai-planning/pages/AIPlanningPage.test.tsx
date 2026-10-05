import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AIPlanningPage } from './AIPlanningPage';

const hooks = vi.hoisted(() => ({ useGetWorkflowsQuery: vi.fn() }));

vi.mock('../../delivery/deliveryApi', () => hooks);

// This is a page-rendering test; workflow fetching is covered by delivery API
// tests and should not make a real request to the backend here.
describe('AIPlanningPage', () => {
    it('renders the planning header and workflow picker', () => {
        hooks.useGetWorkflowsQuery.mockReturnValue({ data: [], isLoading: false, isError: false });
        render(<AIPlanningPage />);
        expect(screen.getByText('🤖 AI Delivery Planning')).toBeInTheDocument();
        expect(screen.getByLabelText('Workflow')).toBeInTheDocument();
    });
});
