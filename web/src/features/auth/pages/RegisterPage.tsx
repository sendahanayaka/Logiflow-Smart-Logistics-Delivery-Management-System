import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../app/store';
import { registerUser, clearError } from '../authSlice';
import '../Auth.css';

export const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // Valid roles: CUSTOMER, WAREHOUSE_STAFF, DRIVER
    // Seeded GUIDs from Phase 2A Backend Setup
    const rolesMapping: Record<string, string> = {
        'CUSTOMER': '22222222-2222-2222-2222-222222222222',
        'WAREHOUSE_STAFF': '33333333-3333-3333-3333-333333333333',
        'DRIVER': '44444444-4444-4444-4444-444444444444'
    };
    const [selectedRole, setSelectedRole] = useState('CUSTOMER');

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { status, error, isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Wait, per instructions: "use a sensible flow... redirecting to login with success message OR log them in".
            // Since authSlice currently handles Register exactly identically to Login (returns AuthResponse), it logs them in implicitly.
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
        dispatch(registerUser({
            name,
            email,
            password,
            roleId: rolesMapping[selectedRole]
        }));
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Create an Account</h2>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            className="auth-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
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
                    <div className="auth-form-group">
                        <label htmlFor="role">Role</label>
                        <select
                            id="role"
                            className="auth-select"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            required
                        >
                            <option value="CUSTOMER">Customer</option>
                            <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
                            <option value="DRIVER">Driver</option>
                        </select>
                    </div>
                    <button type="submit" className="auth-button" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="auth-links">
                    Already have an account? <span style={{ cursor: 'pointer', color: '#08006C', textDecoration: 'underline' }} onClick={() => navigate('/login')}>Login</span>
                </div>
            </div>
        </div>
    );
};
