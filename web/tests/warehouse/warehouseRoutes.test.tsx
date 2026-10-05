import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

vi.mock('../../src/shared/layout/MainLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { MainLayout: () => <Outlet /> }
})

vi.mock('../../src/features/warehouse/pages/WarehouseListPage', () => ({ WarehouseListPage: () => <h1>Warehouse list route</h1> }))
vi.mock('../../src/features/portals/pages/WarehousePortalPage', () => ({ WarehousePortalPage: () => <h1>Warehouse portal route</h1> }))
vi.mock('../../src/features/warehouse/pages/WarehouseDetailsPage', () => ({ WarehouseDetailsPage: () => <h1>Warehouse details route</h1> }))
vi.mock('../../src/features/warehouse/pages/InventoryPage', () => ({ InventoryPage: () => <h1>Warehouse inventory route</h1> }))
vi.mock('../../src/features/warehouse/pages/PackageIntakePage', () => ({ PackageIntakePage: () => <h1>Warehouse intake route</h1> }))
vi.mock('../../src/features/warehouse/pages/DispatchPage', () => ({ DispatchPage: () => <h1>Warehouse dispatch route</h1> }))
vi.mock('../../src/features/warehouse/pages/ThroughputPage', () => ({ ThroughputPage: () => <h1>Warehouse throughput route</h1> }))

import { routes } from '../../src/app/router'
import { renderWithStore } from './testUtils'

describe('S3 warehouse routes', () => {
  it.each([
    ['/warehouse', 'Warehouse portal route'],
    ['/warehouse/manage', 'Warehouse list route'],
    ['/warehouse/warehouse-001', 'Warehouse details route'],
    ['/warehouse/warehouse-001/inventory', 'Warehouse inventory route'],
    ['/warehouse/warehouse-001/intake', 'Warehouse intake route'],
    ['/warehouse/warehouse-001/dispatch', 'Warehouse dispatch route'],
    ['/warehouse/warehouse-001/throughput', 'Warehouse throughput route'],
  ])('renders %s', (path, heading) => {
    const router = createMemoryRouter(routes, { initialEntries: [path] })
    renderWithStore(<RouterProvider router={router} />)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
  })
})
