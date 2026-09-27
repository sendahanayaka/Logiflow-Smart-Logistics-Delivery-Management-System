import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../shared/layout/MainLayout';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { AdminPortalPage } from '../features/portals/pages/AdminPortalPage';
import { CustomerOrderListPage, OrderListPage } from '../features/orders/pages/OrderListPage';
import { OrderCreatePage } from '../features/orders/pages/OrderCreatePage';
import { OrderDetailsPage } from '../features/orders/pages/OrderDetailsPage';
import { WarehousePortalPage } from '../features/portals/pages/WarehousePortalPage';
import { DriverPortalPage } from '../features/portals/pages/DriverPortalPage';

import FleetLandingPage from '../features/fleet/pages/FleetLandingPage';
import DriverListPage from '../features/fleet/pages/DriverListPage';
import DriverCreatePage from '../features/fleet/pages/DriverCreatePage';
import DriverDetailsPage from '../features/fleet/pages/DriverDetailsPage';
import DriverEditPage from '../features/fleet/pages/DriverEditPage';
import VehicleListPage from '../features/fleet/pages/VehicleListPage';
import VehicleCreatePage from '../features/fleet/pages/VehicleCreatePage';
import VehicleDetailsPage from '../features/fleet/pages/VehicleDetailsPage';
import VehicleEditPage from '../features/fleet/pages/VehicleEditPage';
import AssignmentPage from '../features/fleet/pages/AssignmentPage';
import DutySchedulePage from '../features/fleet/pages/DutySchedulePage';
import MaintenancePage from '../features/fleet/pages/MaintenancePage';
import { DispatchPage } from '../features/warehouse/pages/DispatchPage';
import { InventoryPage } from '../features/warehouse/pages/InventoryPage';
import { PackageIntakePage } from '../features/warehouse/pages/PackageIntakePage';
import { ThroughputPage } from '../features/warehouse/pages/ThroughputPage';
import { WarehouseDetailsPage } from '../features/warehouse/pages/WarehouseDetailsPage';
import { WarehouseListPage } from '../features/warehouse/pages/WarehouseListPage';

export const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'admin',
        element: <ProtectedRoute allowedRoles={['ADMIN']} />,
        children: [{ index: true, element: <AdminPortalPage /> }],
      },
      {
        path: 'orders',
        element: <ProtectedRoute allowedRoles={['CUSTOMER']} />,
        children: [
          { index: true, element: <CustomerOrderListPage /> },
          { path: 'new', element: <OrderCreatePage /> },
          { path: 'create', element: <OrderCreatePage /> },
          { path: ':id', element: <OrderDetailsPage /> }
        ]
      },
      {
        path: 'warehouse',
        element: <ProtectedRoute allowedRoles={['WAREHOUSE_STAFF']} />,
        children: [
          { index: true, element: <WarehouseListPage /> },
          { path: 'portal', element: <WarehousePortalPage /> },
          { path: ':warehouseId', element: <WarehouseDetailsPage /> },
          { path: ':warehouseId/inventory', element: <InventoryPage /> },
          { path: ':warehouseId/intake', element: <PackageIntakePage /> },
          { path: ':warehouseId/dispatch', element: <DispatchPage /> },
          { path: ':warehouseId/throughput', element: <ThroughputPage /> },
        ],
      },
      {
        path: 'driver',
        element: <ProtectedRoute allowedRoles={['DRIVER']} />,
        children: [{ index: true, element: <DriverPortalPage /> }],
      },
      // Fleet & Order Management Routes
      {
        path: 'fleet',
        element: <FleetLandingPage />,
      },
      {
        path: 'fleet/drivers',
        element: <DriverListPage />,
      },
      {
        path: 'fleet/drivers/new',
        element: <DriverCreatePage />,
      },
      {
        path: 'fleet/drivers/:id',
        element: <DriverDetailsPage />,
      },
      {
        path: 'fleet/drivers/:id/edit',
        element: <DriverEditPage />,
      },
      {
        path: 'fleet/vehicles',
        element: <VehicleListPage />,
      },
      {
        path: 'fleet/vehicles/new',
        element: <VehicleCreatePage />,
      },
      {
        path: 'fleet/vehicles/:id',
        element: <VehicleDetailsPage />,
      },
      {
        path: 'fleet/vehicles/:id/edit',
        element: <VehicleEditPage />,
      },
      {
        path: 'fleet/assignments',
        element: <AssignmentPage />,
      },
      {
        path: 'fleet/schedules',
        element: <DutySchedulePage />,
      },
      {
        path: 'fleet/maintenance',
        element: <MaintenancePage />,
      },
      {
        path: 'fleet/trips',
        element: <OrderListPage />,
      },
      {
        path: 'drivers',
        element: <DriverListPage />,
      },
      {
        path: 'drivers/new',
        element: <DriverCreatePage />,
      },
      {
        path: 'drivers/:id',
        element: <DriverDetailsPage />,
      },
      {
        path: 'drivers/:id/edit',
        element: <DriverEditPage />,
      },
      {
        path: 'vehicles',
        element: <VehicleListPage />,
      },
      {
        path: 'vehicles/new',
        element: <VehicleCreatePage />,
      },
      {
        path: 'vehicles/:id',
        element: <VehicleDetailsPage />,
      },
      {
        path: 'vehicles/:id/edit',
        element: <VehicleEditPage />,
      },
      {
        path: 'assignments',
        element: <AssignmentPage />,
      },
      {
        path: 'schedules',
        element: <DutySchedulePage />,
      },
      {
        path: 'maintenance',
        element: <MaintenancePage />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
