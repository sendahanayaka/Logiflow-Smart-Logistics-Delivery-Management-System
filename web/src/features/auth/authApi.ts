import { API_BASE_URL, handleApiError } from '../../app/api';

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export const authApi = {
    async register(data: any): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        await handleApiError(response);
        return response.json();
    },

    async login(data: any): Promise<AuthResponse> {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        await handleApiError(response);
        return response.json();
    },

    async getCurrentUser(token: string): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        await handleApiError(response);
        return response.json();
    },
};
