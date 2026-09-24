import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../app/store';
import { logout } from '../../features/auth/authSlice';
import './Navbar.css';

export const Navbar: React.FC = () => {
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };
    return (
        <header className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/">
                        <span className="brand-logo">📦 LogiFlow</span>
                    </Link>
                </div>

                <nav className="navbar-nav">
                    <ul className="nav-links">
                        <li><a href="#home">Home</a></li>
                        <li><a href="#services">Services</a></li>
                        <li><a href="#how-it-works">How It Works</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </nav>

                <div className="navbar-actions">
                    {isAuthenticated && user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
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
                            <Link to="/login" className="btn-login">Login</Link>
                            <Link to="/register" className="btn-primary">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
