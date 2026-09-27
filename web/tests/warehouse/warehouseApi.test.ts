// @vitest-environment node
import { configureStore } from '@reduxjs/toolkit'
import { describe, expect, it, vi } from 'vitest'

import { baseApi } from '../../src/app/api'
import { warehouseApi } from '../../src/features/warehouse/warehouseApi'

function createTestStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}

function mockFetch(handler: (request: Request) => Promise<Response> | Response) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init)
    return handler(request)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const warehouse = {
  id: 'warehouse-001', name: 'Colombo Central', location: 'Colombo', totalVolumeM3: 100,
  occupiedVolumeM3: 25, createdAt: '2026-09-01T00:00:00Z', updatedAt: null,
}
const zone = {
  id: 'zone-001', warehouseId: warehouse.id, name: 'Cold Storage', code: 'COLD', totalVolumeM3: 50,
  occupiedVolumeM3: 10, createdAt: '2026-09-01T00:00:00Z', updatedAt: null,
}

describe('S3 warehouse RTK Query mappings', () => {
  it('maps warehouse, detail, zone, and filtered inventory reads to backend paths', async () => {
    const requests: Request[] = []
    mockFetch(async (request) => {
      requests.push(request)
      if (request.url.includes('/packages')) return json({ items: [], page: 2, pageSize: 10, totalCount: 0, totalPages: 0 })
      if (request.url.endsWith('/zones')) return json([zone])
      if (request.url.endsWith(warehouse.id)) return json(warehouse)
      return json([warehouse])
    })
    const store = createTestStore()

    await store.dispatch(warehouseApi.endpoints.getWarehouses.initiate()).unwrap()
    await store.dispatch(warehouseApi.endpoints.getWarehouse.initiate(warehouse.id)).unwrap()
    await store.dispatch(warehouseApi.endpoints.getStorageZones.initiate(warehouse.id)).unwrap()
    await store.dispatch(warehouseApi.endpoints.getPackages.initiate({
      warehouseId: warehouse.id, page: 2, pageSize: 10, status: 'Available', storageZoneId: zone.id, trackingCode: 'TRACK',
    })).unwrap()

    expect(new URL(requests[0].url).pathname).toBe('/api/warehouse')
    expect(new URL(requests[1].url).pathname).toBe(`/api/warehouse/${warehouse.id}`)
    expect(new URL(requests[2].url).pathname).toBe(`/api/warehouse/${warehouse.id}/zones`)
    const inventoryUrl = new URL(requests[3].url)
    expect(inventoryUrl.pathname).toBe(`/api/warehouse/${warehouse.id}/packages`)
    expect(Object.fromEntries(inventoryUrl.searchParams)).toEqual({
      page: '2', pageSize: '10', status: 'Available', storageZoneId: zone.id, trackingCode: 'TRACK',
    })
  })

  it('maps intake, candidate validation, availability, and dispatch creation payloads without altering backend property names', async () => {
    const requests: Request[] = []
    mockFetch(async (request) => {
      requests.push(request)
      if (request.method === 'PATCH') return json({ ...warehouse, status: 'Available' })
      if (request.url.includes('/validate-candidate')) return json({ result: 'FAIL', agentAvailable: true, ruleResults: [], rejectionReasons: [] })
      if (request.url.includes('/dispatch/')) return json({ result: 'REVISE', batch: null, issues: ['Capacity needs revision.'] })
      return json({ id: 'package-001' }, 201)
    })
    const store = createTestStore()
    const intake = { orderId: 'order-001', warehouseId: warehouse.id, storageZoneId: zone.id, trackingCode: 'TRACK-001', weightKg: 2, volumeM3: 1, isFragile: true, specialHandling: 'Keep dry' }
    const batch = { warehouseId: warehouse.id, vehicleId: 'VEH-001', maxWeightKg: 1000, maxVolumeM3: 10, packageIds: ['package-001'] }
    const candidate = { ...batch, orderIds: ['order-001'] }

    await store.dispatch(warehouseApi.endpoints.receivePackage.initiate(intake)).unwrap()
    await store.dispatch(warehouseApi.endpoints.makePackageAvailable.initiate('package-001')).unwrap()
    await store.dispatch(warehouseApi.endpoints.validateDispatchCandidate.initiate(candidate)).unwrap()
    await store.dispatch(warehouseApi.endpoints.createDispatchBatch.initiate(batch)).unwrap()

    expect(new URL(requests[0].url).pathname).toBe('/api/warehouse/intake')
    expect(await requests[0].clone().json()).toEqual(intake)
    expect(new URL(requests[1].url).pathname).toBe('/api/warehouse/packages/package-001/availability')
    expect(requests[1].method).toBe('PATCH')
    expect(new URL(requests[2].url).pathname).toBe('/api/dispatch/validate-candidate')
    expect(await requests[2].clone().json()).toEqual(candidate)
    expect(new URL(requests[3].url).pathname).toBe('/api/dispatch/batches')
    expect(await requests[3].clone().json()).toEqual(batch)
  })

  it('maps validation and UTC throughput date range requests', async () => {
    const requests: Request[] = []
    mockFetch(async (request) => {
      requests.push(request)
      if (request.url.includes('/validation')) return json({ result: 'PASS', issues: [] })
      return json({ warehouseId: warehouse.id, receivedPackageCount: 0 })
    })
    const store = createTestStore()
    await store.dispatch(warehouseApi.endpoints.getDispatchBatchValidation.initiate('batch-001')).unwrap()
    await store.dispatch(warehouseApi.endpoints.getWarehouseThroughput.initiate({
      warehouseId: warehouse.id, fromUtc: '2026-09-01T00:00:00.000Z', toUtc: '2026-09-30T23:59:59.999Z',
    })).unwrap()

    expect(new URL(requests[0].url).pathname).toBe('/api/dispatch/batches/batch-001/validation')
    const throughputUrl = new URL(requests[1].url)
    expect(throughputUrl.pathname).toBe(`/api/warehouse/${warehouse.id}/reports/throughput`)
    expect(throughputUrl.searchParams.get('fromUtc')).toBe('2026-09-01T00:00:00.000Z')
    expect(throughputUrl.searchParams.get('toUtc')).toBe('2026-09-30T23:59:59.999Z')
  })
})
