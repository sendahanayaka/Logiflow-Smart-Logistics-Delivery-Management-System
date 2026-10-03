// [S1-area]  create-user form
import React, { useState } from 'react';
import { useCreateUserMutation } from '../usersApi';
import { RoleSelector } from './RoleSelector';

export const UserForm: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [createUser, { isLoading }] = useCreateUserMutation();
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        if (!roleId) {
            setMsg({ ok: false, text: 'Please select a role.' });
            return;
        }
        try {
            await createUser({ name, email, password, roleId }).unwrap();
            setMsg({ ok: true, text: 'User created.' });
            setName(''); setEmail(''); setPassword(''); setRoleId('');
        } catch (err: any) {
            setMsg({ ok: false, text: err?.data?.message || 'Could not create user — check the fields.' });
        }
    };

    return (
        <form className="um-form" onSubmit={submit}>
            <h3>Add user</h3>
            {msg && <div className={msg.ok ? 'um-ok' : 'um-error'}>{msg.text}</div>}
            <div className="um-form__row">
                <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <RoleSelector value={roleId} onChange={setRoleId} includeEmpty />
                <button className="um-btn" type="submit" disabled={isLoading}>{isLoading ? 'Adding…' : 'Add user'}</button>
            </div>
        </form>
    );
};
