import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkflowPipeline } from './WorkflowPipeline';

describe('WorkflowPipeline', () => {
    it('renders all six pipeline stages', () => {
        render(<WorkflowPipeline status="AwaitingApproval" />);
        ['Plan', 'Allocate', 'Validate', 'Route', 'Approval', 'Execute'].forEach((label) => {
            expect(screen.getByText(label)).toBeTruthy();
        });
    });

    it('shows the safe-failure message for a failed workflow', () => {
        render(<WorkflowPipeline status="Failed" />);
        expect(screen.getByText(/safe-failure/i)).toBeTruthy();
    });
});
