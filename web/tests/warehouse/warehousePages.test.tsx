import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hooks = vi.hoisted(() => ({
  useGetWarehousesQuery: vi.fn(),
  useGetWarehouseQuery: vi.fn(),
  useGetStorageZonesQuery: vi.fn(),
  useGetPackagesQuery: vi.fn(),
  useMakePackageAvailableMutation: vi.fn(),
  useCreateWarehouseMutation: vi.fn(),
  useCreateStorageZoneMutation: vi.fn(),
}))

vi.mock('../../src/features/warehouse/warehouseApi', () => hooks)

import { InventoryPage } from '../../src/features/warehouse/pages/InventoryPage'
import { WarehouseDetailsPage } from '../../src/features/warehouse/pages/WarehouseDetailsPage'
import { WarehouseListPage } from '../../src/features/warehouse/pages/WarehouseListPage'
import { renderWithStore, availablePackage, receivedPackage, warehouse, zone } from './testUtils'

const idle = { data: undefined, error: undefined, isLoading: false }
const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const

function renderRoute(path: string, route: string, page: React.ReactElement) {
  return renderWithStore(<MemoryRouter initialEntries={[path]} future={routerFuture}><Routes><Route path={route} element={page} /></Routes></MemoryRouter>)
}

beforeEach(() => {
  Object.values(hooks).forEach((hook) => hook.mockReset())
  hooks.useGetWarehousesQuery.mockReturnValue(idle)
  hooks.useGetWarehouseQuery.mockReturnValue(idle)
  hooks.useGetStorageZonesQuery.mockReturnValue(idle)
  hooks.useGetPackagesQuery.mockReturnValue(idle)
  hooks.useMakePackageAvailableMutation.mockReturnValue([vi.fn(), { isLoading: false }])
  hooks.useCreateWarehouseMutation.mockReturnValue([vi.fn(), { isLoading: false }])
  hooks.useCreateStorageZoneMutation.mockReturnValue([vi.fn(), { isLoading: false }])
})

describe('warehouse list and detail pages', () => {
  it('renders warehouse-list loading, success, empty, and error states', () => {
    hooks.useGetWarehousesQuery.mockReturnValueOnce({ ...idle, isLoading: true })
    const loading = renderWithStore(<MemoryRouter future={routerFuture}><WarehouseListPage /></MemoryRouter>)
    expect(screen.getByText('Loading warehouses…')).toBeInTheDocument()
    loading.unmount()

    hooks.useGetWarehousesQuery.mockReturnValueOnce({ ...idle, data: [warehouse] })
    const success = renderWithStore(<MemoryRouter future={routerFuture}><WarehouseListPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Colombo Central' })).toBeInTheDocument()
    expect(screen.getByText('25 / 100 m³')).toBeInTheDocument()
    success.unmount()

    hooks.useGetWarehousesQuery.mockReturnValueOnce({ ...idle, data: [] })
    const empty = renderWithStore(<MemoryRouter future={routerFuture}><WarehouseListPage /></MemoryRouter>)
    expect(screen.getByText(/No warehouses are currently available/)).toBeInTheDocument()
    empty.unmount()

    hooks.useGetWarehousesQuery.mockReturnValueOnce({ ...idle, error: { status: 500, data: { stack: 'secret stack' } } })
    renderWithStore(<MemoryRouter future={routerFuture}><WarehouseListPage /></MemoryRouter>)
    expect(screen.getByText(/warehouse service is temporarily unavailable/i)).toBeInTheDocument()
    expect(screen.queryByText(/secret stack/i)).not.toBeInTheDocument()
  })

  it('creates the first warehouse from the empty workspace', async () => {
    const user = userEvent.setup()
    const createWarehouse = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ id: warehouse.id }) })
    hooks.useGetWarehousesQuery.mockReturnValue({ ...idle, data: [] })
    hooks.useCreateWarehouseMutation.mockReturnValue([createWarehouse, { isLoading: false }])
    renderWithStore(<MemoryRouter future={routerFuture}><WarehouseListPage /></MemoryRouter>)

    await user.type(screen.getByLabelText('Warehouse name'), 'Colombo Central')
    await user.type(screen.getByLabelText('Location'), 'Colombo')
    await user.type(screen.getByLabelText('Total capacity (m³)'), '100')
    await user.click(screen.getByRole('button', { name: 'Create warehouse' }))

    expect(createWarehouse).toHaveBeenCalledWith({ name: 'Colombo Central', location: 'Colombo', totalVolumeM3: 100 })
  })

  it('renders warehouse and deterministic zone capacity details', () => {
    hooks.useGetWarehouseQuery.mockReturnValue({ ...idle, data: warehouse })
    hooks.useGetStorageZonesQuery.mockReturnValue({ ...idle, data: [zone] })
    renderRoute('/warehouse/warehouse-001', '/warehouse/:warehouseId', <WarehouseDetailsPage />)

    expect(screen.getByRole('heading', { name: 'Colombo Central' })).toBeInTheDocument()
    expect(screen.getByText('Colombo')).toBeInTheDocument()
    expect(screen.getByText('75 m³ remaining (25.0% occupied)')).toBeInTheDocument()
    expect(screen.getByText('COLD')).toBeInTheDocument()
    expect(screen.getByText('10 / 50 m³')).toBeInTheDocument()
  })

  it('creates a storage zone from the warehouse details page', async () => {
    const user = userEvent.setup()
    const createStorageZone = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ id: zone.id }) })
    hooks.useGetWarehouseQuery.mockReturnValue({ ...idle, data: warehouse })
    hooks.useGetStorageZonesQuery.mockReturnValue({ ...idle, data: [] })
    hooks.useCreateStorageZoneMutation.mockReturnValue([createStorageZone, { isLoading: false }])
    renderRoute('/warehouse/warehouse-001', '/warehouse/:warehouseId', <WarehouseDetailsPage />)

    await user.type(screen.getByLabelText('Zone name'), 'Cold storage')
    await user.type(screen.getByLabelText('Zone code'), 'COLD-01')
    await user.type(screen.getByLabelText('Total capacity (m³)'), '50')
    await user.click(screen.getByRole('button', { name: 'Create zone' }))

    expect(createStorageZone).toHaveBeenCalledWith({
      warehouseId: warehouse.id,
      body: { name: 'Cold storage', code: 'COLD-01', totalVolumeM3: 50 },
    })
    expect(await screen.findByText('Storage zone created successfully.')).toBeInTheDocument()
  })

  it('renders detail loading and safe not-found errors', () => {
    hooks.useGetWarehouseQuery.mockReturnValue({ ...idle, isLoading: true })
    hooks.useGetStorageZonesQuery.mockReturnValue(idle)
    const loading = renderRoute('/warehouse/warehouse-001', '/warehouse/:warehouseId', <WarehouseDetailsPage />)
    expect(screen.getByText('Loading warehouse details…')).toBeInTheDocument()
    loading.unmount()

    hooks.useGetWarehouseQuery.mockReturnValue({ ...idle, error: { status: 404 } })
    renderRoute('/warehouse/missing', '/warehouse/:warehouseId', <WarehouseDetailsPage />)
    expect(screen.getByText(/could not be found/i)).toBeInTheDocument()
  })
})

describe('inventory page', () => {
  function inventoryResult(items = [receivedPackage, availablePackage]) {
    return { ...idle, data: { items, page: 1, pageSize: 20, totalCount: items.length, totalPages: 2 } }
  }

  it('renders loading, successful inventory, empty inventory, and API-error states', () => {
    hooks.useGetPackagesQuery.mockReturnValueOnce({ ...idle, isLoading: true })
    hooks.useGetStorageZonesQuery.mockReturnValue({ ...idle, data: [zone] })
    const loading = renderRoute('/warehouse/warehouse-001/inventory', '/warehouse/:warehouseId/inventory', <InventoryPage />)
    expect(screen.getByText('Loading inventory…')).toBeInTheDocument()
    loading.unmount()

    hooks.useGetPackagesQuery.mockReturnValueOnce(inventoryResult())
    const success = renderRoute('/warehouse/warehouse-001/inventory', '/warehouse/:warehouseId/inventory', <InventoryPage />)
    expect(screen.getByText('TRACK-REC')).toBeInTheDocument()
    expect(screen.getByText('TRACK-AVL')).toBeInTheDocument()
    success.unmount()

    hooks.useGetPackagesQuery.mockReturnValueOnce(inventoryResult([]))
    const empty = renderRoute('/warehouse/warehouse-001/inventory', '/warehouse/:warehouseId/inventory', <InventoryPage />)
    expect(screen.getByText(/No packages match/i)).toBeInTheDocument()
    empty.unmount()

    hooks.useGetPackagesQuery.mockReturnValueOnce({ ...idle, error: { status: 500 } })
    renderRoute('/warehouse/warehouse-001/inventory', '/warehouse/:warehouseId/inventory', <InventoryPage />)
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument()
  })

  it('sends status, zone, tracking search, and pagination state through the inventory query hook', async () => {
    const user = userEvent.setup()
    hooks.useGetPackagesQuery.mockReturnValue(inventoryResult())
    hooks.useGetStorageZonesQuery.mockReturnValue({ ...idle, data: [zone] })
    renderRoute('/warehouse/warehouse-001/inventory', '/warehouse/:warehouseId/inventory', <InventoryPage />)

    await user.selectOptions(screen.getByLabelText('Status'), 'Available')
    await user.selectOptions(screen.getByLabelText('Storage zone'), zone.id)
    await user.type(screen.getByLabelText('Tracking code'), 'TRACK')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    const latestArgs = hooks.useGetPackagesQuery.mock.calls.at(-1)?.[0]
    expect(latestArgs).toMatchObject({ warehouseId: warehouse.id, page: 2, pageSize: 20, status: 'Available', storageZoneId: zone.id, trackingCode: 'TRACK' })
  })

  it('only exposes the explicit Received-to-Available action and handles mutation conflicts safely', async () => {
    const user = userEvent.setup()
    const makeAvailable = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockRejectedValue({ status: 409, data: { stack: 'do not expose' } }),
    })
    hooks.useGetPackagesQuery.mockReturnValue(inventoryResult())
    hooks.useGetStorageZonesQuery.mockReturnValue({ ...idle, data: [zone] })
    hooks.useMakePackageAvailableMutation.mockReturnValue([makeAvailable, { isLoading: false }])
    renderRoute('/warehouse/warehouse-001/inventory', '/warehouse/:warehouseId/inventory', <InventoryPage />)

    expect(screen.getByRole('button', { name: 'Make available' })).toBeInTheDocument()
    expect(screen.getAllByText('Available')).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: 'Make available' }))

    expect(makeAvailable).toHaveBeenCalledWith(receivedPackage.id)
    expect(await screen.findByText(/Warehouse conflict/i)).toBeInTheDocument()
    expect(screen.queryByText(/do not expose/i)).not.toBeInTheDocument()
  })
})
