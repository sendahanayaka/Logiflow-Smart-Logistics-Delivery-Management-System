// [S1-area]  role dropdown
import React from 'react';
import { useGetRolesQuery } from '../usersApi';

interface Props {
    value: string;
    onChange: (roleId: string) => void;
    disabled?: boolean;
    includeEmpty?: boolean;
}

export const RoleSelector: React.FC<Props> = ({ value, onChange, disabled, includeEmpty }) => {
    const { data: roles = [] } = useGetRolesQuery();
    return (
        <select className="um-select" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            {includeEmpty && <option value="">Select role…</option>}
            {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
            ))}
        </select>
    );
};
