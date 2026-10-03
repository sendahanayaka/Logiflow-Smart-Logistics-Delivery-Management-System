// [S1-area] User management types — mirror the backend DTOs (camelCase).

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: string;
    isActive: boolean;
    createdAt: string;
}

export interface Role {
    id: string;
    name: string;
}

export interface CreateUserRequest {
    name: string;
    email: string;
    password: string;
    roleId: string;
}
