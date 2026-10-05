import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/authSlice';
import { baseApi } from '../../app/api';
import { Navbar } from './Navbar';
import { vi } from 'vitest';

vi.mock('../../features/notifications/NotificationBell', () => ({
    NotificationBell: () => <div data-testid="mock-notification-bell" />
}));

// The Navbar renders <NotificationBell/>, which uses RTK-Query hooks, so the
// test store must register the api slice (reducer + middleware).
const makeStore = (preloadedAuth: Record<string, unknown>) =>
    // Cast the whole config to sidestep RTK's deep middleware generic inference
    // in the test; at runtime this registers the api reducer + middleware.
    configureStore({
        reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
        middleware: (getDefaultMiddleware: any) => getDefaultMiddleware().concat(baseApi.middleware),
        preloadedState: { auth: preloadedAuth },
    } as any);

const renderWithRouterAndStore = (store: any, component: React.ReactNode) => {
    return render(
        <Provider store={store}>
            <MemoryRouter initialEntries={['/']}>
                {component}
            </MemoryRouter>
        </Provider>
    );
};

describe('Navbar.tsx Logout Behaviors', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders Logout button securely for authenticated users', () => {
        const store = makeStore({
            isAuthenticated: true,
            user: { name: 'Test User', id: '1', email: 'a@a.com', role: 'CUSTOMER', isActive: true },
            token: 'mock-token',
            status: 'idle' as const,
            error: null
        });

        renderWithRouterAndStore(store, <Navbar />);

        expect(screen.getByText('Welcome, Test User')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
        expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
    });

    it('clears session and returns pure Login/Register paths globally upon Logout execution', () => {
        const store = makeStore({
            isAuthenticated: true,
            user: { name: 'Test User', id: '1', email: 'a@a.com', role: 'CUSTOMER', isActive: true },
            token: 'mock-token',
            status: 'idle' as const,
            error: null
        });

        renderWithRouterAndStore(store, <Navbar />);

        const logoutBtn = screen.getByRole('button', { name: /logout/i });
        fireEvent.click(logoutBtn);

        const state = store.getState().auth;
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.token).toBeNull();
    });
});
