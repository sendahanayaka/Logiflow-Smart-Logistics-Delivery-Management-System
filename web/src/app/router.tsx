import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import DriverListPage from '../features/fleet/pages/DriverListPage';
import DriverCreatePage from '../features/fleet/pages/DriverCreatePage';
import DriverDetailsPage from '../features/fleet/pages/DriverDetailsPage';
import DriverEditPage from '../features/fleet/pages/DriverEditPage';
import VehicleListPage from '../features/fleet/pages/VehicleListPage';
import VehicleCreatePage from '../features/fleet/pages/VehicleCreatePage';
import VehicleDetailsPage from '../features/fleet/pages/VehicleDetailsPage';
import VehicleEditPage from '../features/fleet/pages/VehicleEditPage';
import AssignmentPage from '../features/fleet/pages/AssignmentPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DriverListPage />,
  },
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
]);
