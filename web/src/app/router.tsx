import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../shared/layout/MainLayout';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <LandingPage />
            },
            {
                path: 'login',
                element: <LoginPage />
            },
            {
                path: 'register',
                element: <RegisterPage />
            },
            {
                path: 'admin',
                element: <ProtectedRoute allowedRoles={['ADMIN']} />
            },
            {
                path: 'orders',
                element: <ProtectedRoute allowedRoles={['CUSTOMER']} />
            },
            {
                path: 'warehouse',
                element: <ProtectedRoute allowedRoles={['WAREHOUSE_STAFF']} />
            },
            {
                path: 'driver',
                element: <ProtectedRoute allowedRoles={['DRIVER']} />
            }
        ]
    }
]);
