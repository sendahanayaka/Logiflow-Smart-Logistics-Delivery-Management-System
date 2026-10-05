import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Browser requests use the Vite /api proxy. Node-based RTK Query tests need an
// absolute URL because the platform Request implementation cannot parse a
// relative URL without a browser location.
export const API_BASE_URL = configuredApiBaseUrl || '/api';
const apiRequestBaseUrl = configuredApiBaseUrl ||
  (typeof window === 'undefined' ? 'http://localhost:5173/api' : '/api');

// Shared handling for an expired/invalid session: drop the stale token and send
// the user to login once, instead of leaving them on broken pages.
export const handleSessionExpired = () => {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem('token'); } catch { /* ignore */ }
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
};

export const handleApiError = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      handleSessionExpired();
    }
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

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiRequestBaseUrl,
  prepareHeaders: (headers, { getState }: any) => {
    const token = getState()?.auth?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Any 401 from an RTK Query call → treat the session as expired.
const baseQueryWithReauth: typeof rawBaseQuery = async (args, apiCtx, extraOptions) => {
  const result = await rawBaseQuery(args, apiCtx, extraOptions);
  if (result.error && (result.error as { status?: number }).status === 401) {
    handleSessionExpired();
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
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
    'Order',
    'Notification',
    'Message',
    'Conversation',
  ],
  endpoints: () => ({}),
});
