import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect } from 'vitest';
import { store } from '../../../app/store';
import { AIPlanningPage } from './AIPlanningPage';

// The page is now backend-backed (RTK Query) and admin-only; it no longer calls the
// internal agent directly from the browser. We render it inside the real store and
// assert the header + workflow picker are present (the workflow fetch is async).
describe('AIPlanningPage', () => {
    it('renders the planning header and workflow picker', () => {
        render(
            <Provider store={store}>
                <AIPlanningPage />
            </Provider>,
        );
        expect(screen.getByText('🤖 AI Delivery Planning')).toBeInTheDocument();
        expect(screen.getByLabelText('Workflow')).toBeInTheDocument();
    });
});
