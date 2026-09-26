import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../authSlice';
import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
    const createTestStore = (authState: any) => configureStore({
        reducer: { auth: authReducer },
        preloadedState: {
            auth: authState
        }
    });

    const renderWithRouterAndStore = (store: any, component: React.ReactNode) => {
        return render(
            <Provider store={store}>
                <MemoryRouter initialEntries={['/protected']}>
                    <Routes>
                        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                        <Route path="/protected" element={component}>
                            <Route index element={<div data-testid="protected-content">Secret Content</div>} />
                        </Route>
                    </Routes>
                </MemoryRouter>
            </Provider>
        );
    };

    it('redirects unauthenticated user to /login', () => {
        const store = createTestStore({
            isAuthenticated: false,
            user: null,
            status: 'idle'
        });

        renderWithRouterAndStore(store, <ProtectedRoute />);

        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('allows authenticated user with correct role to access route', () => {
        const store = createTestStore({
            isAuthenticated: true,
            user: { role: 'CUSTOMER' },
            status: 'idle'
        });

        renderWithRouterAndStore(store, <ProtectedRoute allowedRoles={['CUSTOMER']} />);

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('redirects authenticated user with an unauthorized role to /login', () => {
        const store = createTestStore({
            isAuthenticated: true,
            user: { role: 'DRIVER' },
            status: 'idle'
        });

        // Protected for CUSTOMER only
        renderWithRouterAndStore(store, <ProtectedRoute allowedRoles={['CUSTOMER']} />);

        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('shows loading state and does not expose protected content while restoring auth', () => {
        const store = createTestStore({
            isAuthenticated: false,
            user: null,
            status: 'loading'
        });

        renderWithRouterAndStore(store, <ProtectedRoute />);

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
});
