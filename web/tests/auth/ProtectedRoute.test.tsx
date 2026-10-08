import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../../src/features/auth/components/ProtectedRoute';
import * as reactRedux from 'react-redux';

// Mock react-redux to simulate different auth states without a real store
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux');
  return {
    // @ts-ignore
    ...actual,
    useSelector: vi.fn(),
  };
});

describe('ProtectedRoute Component', () => {

  it('redirects unauthenticated users to /login', () => {
    // Mock state: not authenticated
    (reactRedux.useSelector as any).mockReturnValue({
      isAuthenticated: false,
      user: null,
      status: 'idle'
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div data-testid="protected-content">Access Granted</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Assert redirection occurred
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('allows authenticated users to access protected routes', () => {
    // Mock state: authenticated
    (reactRedux.useSelector as any).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'CUSTOMER' },
      status: 'idle'
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div data-testid="protected-content">Access Granted</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Assert rendered via Outlet
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects authenticated users without the required role', () => {
    // Mock state: authenticated but wrong role
    (reactRedux.useSelector as any).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'CUSTOMER' },
      status: 'idle'
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/protected" element={<div data-testid="protected-content">Access Granted</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Assert eviction due to role mismatch
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
