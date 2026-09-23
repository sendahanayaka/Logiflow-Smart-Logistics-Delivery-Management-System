/// <reference types="vite/client" />

// [ALL] Shared RTK Query base API. Feature APIs inject their endpoints here.
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: [
    'Warehouse',
    'WarehouseZones',
    'WarehouseInventory',
    'Package',
    'DispatchBatch',
    'Throughput',
  ],
  endpoints: () => ({}),
})
