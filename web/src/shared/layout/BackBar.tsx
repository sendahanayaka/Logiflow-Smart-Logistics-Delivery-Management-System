import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import './BackBar.css';

// Role-home / auth / landing routes where a "back" control is not appropriate
// (going back would land on login or leave the app). Everywhere else gets one.
const HOME_PATHS = new Set<string>([
  '/', '/login', '/register', '/unauthorized',
  '/admin', '/orders', '/warehouse', '/driver', '/dashboard', '/fleet',
]);

const homeFor = (role?: string): string => {
  switch (role) {
    case 'ADMIN': return '/admin';
    case 'CUSTOMER': return '/orders';
    case 'WAREHOUSE_STAFF': return '/warehouse';
    case 'DRIVER': return '/driver';
    default: return '/';
  }
};

export const BackBar: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const role = useSelector((s: RootState) => s.auth.user?.role);

  if (HOME_PATHS.has(pathname)) return null;

  const goBack = () => {
    // When the page was deep-linked / reloaded there's no history to pop, so
    // fall back to the signed-in role's home instead of leaving the app.
    const idx = (window.history.state && (window.history.state as { idx?: number }).idx) || 0;
    if (idx > 0) navigate(-1);
    else navigate(homeFor(role));
  };

  return (
    <div className="back-bar">
      <button type="button" className="back-bar__btn" onClick={goBack}>← Back</button>
    </div>
  );
};
