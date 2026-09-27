import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import type { ReactElement } from 'react'
import { vi } from 'vitest'

import { baseApi } from '../../src/app/api'
import authReducer from '../../src/features/auth/authSlice'

export function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 'warehouse-test-user',
          name: 'Warehouse Tester',
          email: 'warehouse@example.test',
          role: 'WAREHOUSE_STAFF',
          isActive: true,
        },
        token: null,
        isAuthenticated: true,
        status: 'idle' as const,
        error: null,
      },
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  })
}

export function renderWithStore(ui: ReactElement) {
  const store = createTestStore()
  return { store, ...render(<Provider store={store}>{ui}</Provider>) }
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export function mockFetch(handler: (request: Request) => Promise<Response> | Response) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    return handler(request)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export const warehouse = {
  id: 'warehouse-001', name: 'Colombo Central', location: 'Colombo', totalVolumeM3: 100,
  occupiedVolumeM3: 25, createdAt: '2026-09-01T00:00:00Z', updatedAt: null,
}

export const zone = {
  id: 'zone-001', warehouseId: warehouse.id, name: 'Cold Storage', code: 'COLD', totalVolumeM3: 50,
  occupiedVolumeM3: 10, createdAt: '2026-09-01T00:00:00Z', updatedAt: null,
}

export const receivedPackage = {
  id: 'package-received', orderId: 'order-001', warehouseId: warehouse.id, storageZoneId: zone.id,
  trackingCode: 'TRACK-REC', weightKg: 2, volumeM3: 1, isFragile: false, specialHandling: null,
  status: 'Received' as const, receivedAt: '2026-09-02T00:00:00Z',
}

export const availablePackage = {
  ...receivedPackage, id: 'package-available', trackingCode: 'TRACK-AVL', status: 'Available' as const,
}
