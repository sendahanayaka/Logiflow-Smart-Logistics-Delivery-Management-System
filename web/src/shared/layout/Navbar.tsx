import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { logout } from '../../features/auth/authSlice';
import { NotificationBell } from '../../features/notifications/NotificationBell';
import './Navbar.css';

import logoUrl from '../../assets/logo.png';

export const Navbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const close = () => setMenuOpen(false);

    const handleLogout = () => {
        close();
        dispatch(logout());
        navigate('/login');
    };

    return (
        <header className={`navbar${menuOpen ? ' navbar--menu-open' : ''}`}>
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={logoUrl} alt="LogiFlow Logo" style={{ height: '65px', display: 'block' }} />
                    </Link>
                </div>

                <button
                    type="button"
                    className="navbar-menu-toggle"
                    aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={menuOpen}
                    aria-controls="primary-navigation"
                    onClick={() => setMenuOpen((open) => !open)}
                >
                    <span />
                    <span />
                    <span />
                </button>

                <nav className="navbar-nav" id="primary-navigation">
                    <ul className="nav-links">
                        {!isAuthenticated && (
                            <>
                                <li><a onClick={close} href="#home">Home</a></li>
                                <li><a onClick={close} href="#success">Our Success</a></li>
                                <li><a onClick={close} href="#about">About</a></li>
                                <li><a onClick={close} href="#contact">Contact</a></li>
                            </>
                        )}
                        {isAuthenticated && user?.role === 'CUSTOMER' && (
                            <>
                                <li><Link onClick={close} to="/orders">My Orders</Link></li>
                                <li><Link onClick={close} to="/orders/create">Create Order</Link></li>
                            </>
                        )}
                        {isAuthenticated && user?.role === 'ADMIN' && (
                            <>
                                <li><Link onClick={close} to="/admin">Dashboard</Link></li>
                                <li><Link onClick={close} to="/users">Users</Link></li>
                                {/* Agent planning is an ops-manager tool; customers never see the agentic flow. */}
                                <li><Link onClick={close} to="/ai-planning" style={{ color: 'var(--color-navy, #08006C)', fontWeight: 'bold' }}>AI Planning</Link></li>
                            </>
                        )}
                        {isAuthenticated && user?.role === 'WAREHOUSE_STAFF' && (
                            <li><Link onClick={close} to="/warehouse">Warehouse</Link></li>
                        )}
                        {isAuthenticated && user?.role === 'DRIVER' && (
                            <li><Link onClick={close} to="/driver">My Runs</Link></li>
                        )}
                    </ul>
                </nav>

                <div className="navbar-actions">
                    {isAuthenticated && user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                            <NotificationBell />
                            {(user.role === 'CUSTOMER' || user.role === 'DRIVER') && (
                                <Link onClick={close} to="/messages" className="btn-login">Messages</Link>
                            )}
                            <Link onClick={close} to="/track" className="btn-login">Track</Link>
                            <span style={{ fontWeight: '500', color: 'var(--color-navy, #08006C)' }}>
                                Welcome, {user.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="btn-primary"
                                style={{ backgroundColor: '#d9534f', fontSize: '0.95rem', padding: '0.5rem 1.2rem' }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link onClick={close} to="/login" className="btn-login">Login</Link>
                            <Link onClick={close} to="/register" className="btn-primary">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
