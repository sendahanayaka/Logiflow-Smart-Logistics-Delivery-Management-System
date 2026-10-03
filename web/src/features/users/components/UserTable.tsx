// [S1-area]  users table (change role / activate-deactivate)
import React from 'react';
import type { User } from '../types';
import { useChangeUserRoleMutation, useSetUserStatusMutation } from '../usersApi';
import { RoleSelector } from './RoleSelector';

export const UserTable: React.FC<{ users: User[] }> = ({ users }) => {
    const [changeRole] = useChangeUserRoleMutation();
    const [setStatus] = useSetUserStatusMutation();

    if (users.length === 0) return <p className="um-muted">No users yet.</p>;

    return (
        <table className="um-table">
            <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
                {users.map((u) => (
                    <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td><RoleSelector value={u.roleId} onChange={(roleId) => changeRole({ id: u.id, roleId })} /></td>
                        <td>
                            <span className={`um-status um-status--${u.isActive ? 'active' : 'inactive'}`}>
                                {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td>
                            <button className="um-toggle" onClick={() => setStatus({ id: u.id, isActive: !u.isActive })}>
                                {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
