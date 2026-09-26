import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { loginUser, clearError } from '../authSlice';
import '../Auth.css';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { status, error, user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Centralized role routing
            switch (user.role) {
                case 'ADMIN': navigate('/admin'); break;
                case 'CUSTOMER': navigate('/orders'); break;
                case 'WAREHOUSE_STAFF': navigate('/warehouse'); break;
                case 'DRIVER': navigate('/driver'); break;
                default: navigate('/'); break;
            }
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(loginUser({ email, password }));
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Log in to LogiFlow</h2>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="auth-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="auth-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="auth-button" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="auth-links">
                    Don't have an account? <Link to="/register">Register</Link>
                </div>
            </div>
        </div>
    );
};
