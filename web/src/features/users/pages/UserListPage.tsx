// [S1-area]  user management page
import React from 'react';
import '../../portals/Portal.css';
import '../users.css';
import { useGetUsersQuery } from '../usersApi';
import { UserForm } from '../components/UserForm';
import { UserTable } from '../components/UserTable';

export const UserListPage: React.FC = () => {
    const { data: users = [], isLoading, isError } = useGetUsersQuery();

    return (
        <div className="portal-container">
            <header className="portal-header">
                <span className="portal-role-badge">ADMIN</span>
                <h1>User Management</h1>
                <p>Create accounts and manage roles &amp; access across the platform.</p>
            </header>

            <UserForm />

            <div className="um-list">
                {isLoading ? (
                    <p className="um-muted">Loading users…</p>
                ) : isError ? (
                    <p className="um-error">Couldn’t load users. Is the API running?</p>
                ) : (
                    <UserTable users={users} />
                )}
            </div>
        </div>
    );
};

export default UserListPage;
