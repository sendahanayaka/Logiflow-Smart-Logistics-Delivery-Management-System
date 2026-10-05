import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { logout } from '../../features/auth/authSlice';
import './Navbar.css';

export const Navbar: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const handleLogout = () => {
        setMenuOpen(false);
        dispatch(logout());
        navigate('/login');
    };

    return (
        <header className={`navbar${menuOpen ? ' navbar--menu-open' : ''}`}>
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/">
                        <span className="brand-logo">📦 LogiFlow</span>
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
                        {isAuthenticated && user?.role === 'CUSTOMER' ? (
                            <>
                                <li><Link onClick={() => setMenuOpen(false)} to="/orders">Dashboard</Link></li>
                                <li><Link onClick={() => setMenuOpen(false)} to="/orders">My Orders</Link></li>
                                <li><Link onClick={() => setMenuOpen(false)} to="/orders/create">Create Order</Link></li>
                            </>
                        ) : (
                            <>
                                <li><a onClick={() => setMenuOpen(false)} href="#home">Home</a></li>
                                <li><a onClick={() => setMenuOpen(false)} href="#services">Services</a></li>
                                <li><a onClick={() => setMenuOpen(false)} href="#how-it-works">How It Works</a></li>
                                <li><a onClick={() => setMenuOpen(false)} href="#about">About</a></li>
                                <li><a onClick={() => setMenuOpen(false)} href="#contact">Contact</a></li>
                            </>
                        )}
                        {/* Agent planning is an ops-manager tool; customers never see the agentic flow. */}
                        {isAuthenticated && user?.role === 'ADMIN' && (
                            <li><Link onClick={() => setMenuOpen(false)} to="/ai-planning" style={{ color: 'var(--color-navy, #08006C)', fontWeight: 'bold' }}>AI Planning</Link></li>
                        )}
                    </ul>
                </nav>

                <div className="navbar-actions">
                    {isAuthenticated && user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                            <Link onClick={() => setMenuOpen(false)} to="/track" className="btn-login">Track</Link>
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
                            <Link onClick={() => setMenuOpen(false)} to="/login" className="btn-login">Login</Link>
                            <Link onClick={() => setMenuOpen(false)} to="/register" className="btn-primary">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
