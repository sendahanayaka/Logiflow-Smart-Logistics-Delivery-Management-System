import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
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
import OrderListPage from '../features/orders/pages/OrderListPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <DriverListPage />,
      },
      {
        path: '/fleet',
        element: <FleetLandingPage />,
      },
      {
        path: '/fleet/drivers',
        element: <DriverListPage />,
      },
      {
        path: '/fleet/drivers/new',
        element: <DriverCreatePage />,
      },
      {
        path: '/fleet/drivers/:id',
        element: <DriverDetailsPage />,
      },
      {
        path: '/fleet/drivers/:id/edit',
        element: <DriverEditPage />,
      },
      {
        path: '/fleet/vehicles',
        element: <VehicleListPage />,
      },
      {
        path: '/fleet/vehicles/new',
        element: <VehicleCreatePage />,
      },
      {
        path: '/fleet/vehicles/:id',
        element: <VehicleDetailsPage />,
      },
      {
        path: '/fleet/vehicles/:id/edit',
        element: <VehicleEditPage />,
      },
      {
        path: '/fleet/assignments',
        element: <AssignmentPage />,
      },
      {
        path: '/fleet/schedules',
        element: <DutySchedulePage />,
      },
      {
        path: '/fleet/maintenance',
        element: <MaintenancePage />,
      },
      {
        path: '/fleet/trips',
        element: <OrderListPage />,
      },
      {
        path: '/orders',
        element: <OrderListPage />,
      },
      // Backward Compatibility Preserved Aliases
      {
        path: '/drivers',
        element: <DriverListPage />,
      },
      {
        path: '/drivers/new',
        element: <DriverCreatePage />,
      },
      {
        path: '/drivers/:id',
        element: <DriverDetailsPage />,
      },
      {
        path: '/drivers/:id/edit',
        element: <DriverEditPage />,
      },
      {
        path: '/vehicles',
        element: <VehicleListPage />,
      },
      {
        path: '/vehicles/new',
        element: <VehicleCreatePage />,
      },
      {
        path: '/vehicles/:id',
        element: <VehicleDetailsPage />,
      },
      {
        path: '/vehicles/:id/edit',
        element: <VehicleEditPage />,
      },
      {
        path: '/assignments',
        element: <AssignmentPage />,
      },
      {
        path: '/schedules',
        element: <DutySchedulePage />,
      },
      {
        path: '/maintenance',
        element: <MaintenancePage />,
      },
    ],
  },
]);
