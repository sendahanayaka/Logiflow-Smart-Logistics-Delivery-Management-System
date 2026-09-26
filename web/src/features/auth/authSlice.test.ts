import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import authReducer, { logout } from './authSlice';

describe('authSlice', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns the initial unauthenticated state', () => {
        const initialState = authReducer(undefined, { type: 'unknown' });
        expect(initialState).toEqual({
            user: null,
            token: null,
            isAuthenticated: false,
            status: 'idle',
            error: null,
        });
    });

    it('clears authentication state on logout', () => {
        // Set up an authenticated state
        const loggedInState = {
            user: { id: '1', name: 'Test', email: 'test@example.com', role: 'CUSTOMER', isActive: true },
            token: 'fake-jwt-token',
            isAuthenticated: true,
            status: 'idle' as const,
            error: null,
        };
        localStorage.setItem('token', 'fake-jwt-token');

        const stateAfterLogout = authReducer(loggedInState, logout());

        expect(stateAfterLogout.user).toBeNull();
        expect(stateAfterLogout.token).toBeNull();
        expect(stateAfterLogout.isAuthenticated).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('authentication state can contain the authenticated user/token', () => {
        // Simulate loginUser.fulfilled by manually dispatching the action or just checking state bounds
        // Since we want to test the slice properly, we can just define the action directly
        const userPayload = {
            token: 'valid-jwt',
            user: { id: '2', name: 'Alice', email: 'a@example.com', role: 'ADMIN', isActive: true }
        };

        const action = { type: 'auth/login/fulfilled', payload: userPayload };
        const state = authReducer(undefined, action);

        expect(state.isAuthenticated).toBe(true);
        expect(state.token).toBe('valid-jwt');
        expect(state.user?.name).toBe('Alice');
        expect(state.user?.role).toBe('ADMIN');
    });
});
