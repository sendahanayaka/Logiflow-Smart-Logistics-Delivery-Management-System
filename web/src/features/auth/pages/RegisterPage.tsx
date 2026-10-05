import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { registerUser, clearError } from '../authSlice';
import '../Auth.css';

// Public registration is CUSTOMER-only. Drivers and warehouse staff are created
// by an admin from the Users screen — no role picker is shown here.
export const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { status, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated && user) {
            switch (user.role) {
                case 'ADMIN': navigate('/admin'); break;
                case 'CUSTOMER': navigate('/orders'); break;
                case 'WAREHOUSE_STAFF': navigate('/warehouse'); break;
                case 'DRIVER': navigate('/driver'); break;
                default: navigate('/'); break;
            }
        }
    }, [isAuthenticated, user, navigate]);

    const validate = () => {
        const next: typeof errors = {};
        const trimmedName = name.trim();
        if (!trimmedName) next.name = 'Full name is required.';
        else if (trimmedName.length > 255) next.name = 'Name cannot exceed 255 characters.';

        const trimmedEmail = email.trim();
        if (!trimmedEmail) next.email = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) next.email = 'Enter a valid email address.';

        if (!password) next.password = 'Password is required.';
        else if (password.length < 6) next.password = 'Password must be at least 6 characters.';

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        dispatch(registerUser({ name: name.trim(), email: email.trim(), password }));
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Create a Customer Account</h2>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="auth-form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            className="auth-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && <span className="auth-field-error">{errors.name}</span>}
                    </div>
                    <div className="auth-form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="auth-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && <span className="auth-field-error">{errors.email}</span>}
                    </div>
                    <div className="auth-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-invalid={!!errors.password}
                        />
                        {errors.password && <span className="auth-field-error">{errors.password}</span>}
                    </div>
                    <button type="submit" className="auth-button" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="auth-links">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};
