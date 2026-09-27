import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../shared/layout/MainLayout';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { AdminPortalPage } from '../features/portals/pages/AdminPortalPage';
import { OrderListPage } from '../features/orders/pages/OrderListPage';
import { OrderCreatePage } from '../features/orders/pages/OrderCreatePage';
import { OrderDetailsPage } from '../features/orders/pages/OrderDetailsPage';
import { WarehousePortalPage } from '../features/portals/pages/WarehousePortalPage';
import { DriverPortalPage } from '../features/portals/pages/DriverPortalPage';

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
                element: <ProtectedRoute allowedRoles={['ADMIN']} />,
                children: [
                    { index: true, element: <AdminPortalPage /> }
                ]
            },
            {
                path: 'orders',
                element: <ProtectedRoute allowedRoles={['CUSTOMER']} />,
                children: [
                    { index: true, element: <OrderListPage /> },
                    { path: 'new', element: <OrderCreatePage /> },
                    { path: 'create', element: <OrderCreatePage /> },
                    { path: ':id', element: <OrderDetailsPage /> }
                ]
            },
            {
                path: 'warehouse',
                element: <ProtectedRoute allowedRoles={['WAREHOUSE_STAFF']} />,
                children: [
                    { index: true, element: <WarehousePortalPage /> }
                ]
            },
            {
                path: 'driver',
                element: <ProtectedRoute allowedRoles={['DRIVER']} />,
                children: [
                    { index: true, element: <DriverPortalPage /> }
                ]
            }
        ]
    }
]);