import React from 'react';
import '../Portal.css';

export const CustomerOrdersPage: React.FC = () => {
    return (
        <div className="portal-container">
            <header className="portal-header">
                <span className="portal-role-badge">CUSTOMER</span>
                <h1>Customer Orders</h1>
                <p>Create and manage delivery orders and track order-related information.</p>
            </header>
            <main>
                <div className="portal-dashboard-placeholder">
                    <h3>Orders Module</h3>
                    <p>
                        Detailed functionality will be implemented in later phases.
                        This area will allow customers to inject requests, view logistical states, and process invoices.
                    </p>
                </div>
            </main>
        </div>
    );
};
