import React from 'react';
import '../Portal.css';

export const AdminPortalPage: React.FC = () => {
    return (
        <div className="portal-container">
            <header className="portal-header">
                <span className="portal-role-badge">ADMIN</span>
                <h1>Admin Portal</h1>
                <p>Administration and system management portal.</p>
            </header>
            <main>
                <div className="portal-dashboard-placeholder">
                    <h3>Dashboard Module</h3>
                    <p>
                        Detailed functionality will be implemented in later phases.
                        This area will house system configurations, user management controls, and global metrics.
                    </p>
                </div>
            </main>
        </div>
    );
};
