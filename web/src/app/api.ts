import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }: any) => {
      const token = getState()?.auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Driver', 'Vehicle', 'Assignment', 'DutySchedule', 'MaintenanceRecord', 'Workflow', 'Shipment', 'Tracking'],
  endpoints: () => ({}),
});
