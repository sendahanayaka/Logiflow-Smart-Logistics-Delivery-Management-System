import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Browser requests use the Vite /api proxy. Node-based RTK Query tests need an
// absolute URL because the platform Request implementation cannot parse a
// relative URL without a browser location.
export const API_BASE_URL = configuredApiBaseUrl || '/api';
const apiRequestBaseUrl = configuredApiBaseUrl ||
  (typeof window === 'undefined' ? 'http://localhost:5173/api' : '/api');

export const handleApiError = async (response: Response) => {
  if (!response.ok) {
    let message = 'An unexpected error occurred';
    try {
      const errData = await response.json();
      message = errData.message || message;
    } catch {
      message = response.statusText;
    }
    throw new Error(message);
  }
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiRequestBaseUrl,
    prepareHeaders: (headers, { getState }: any) => {
      const token = getState()?.auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Driver',
    'Vehicle',
    'Assignment',
    'DutySchedule',
    'MaintenanceRecord',
    'Workflow',
    'Shipment',
    'Tracking',
    'Warehouse',
    'WarehouseZones',
    'WarehouseInventory',
    'Package',
    'DispatchBatch',
    'Throughput',
    'User',
    'Role',
  ],
  endpoints: () => ({}),
});
