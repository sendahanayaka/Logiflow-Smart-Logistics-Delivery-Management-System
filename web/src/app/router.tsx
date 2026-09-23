// [ALL] Minimal route registration. Feature-level access rules are added by each
// team once the shared authentication guard is implemented.
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'

import { DispatchPage } from '../features/warehouse/pages/DispatchPage'
import { InventoryPage } from '../features/warehouse/pages/InventoryPage'
import { PackageIntakePage } from '../features/warehouse/pages/PackageIntakePage'
import { ThroughputPage } from '../features/warehouse/pages/ThroughputPage'
import { WarehouseDetailsPage } from '../features/warehouse/pages/WarehouseDetailsPage'
import { WarehouseListPage } from '../features/warehouse/pages/WarehouseListPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <main style={{ fontFamily: 'system-ui, sans-serif', margin: '0 auto', maxWidth: 1200, padding: 24 }}>
        <nav aria-label="Warehouse navigation" style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <Link to="/warehouse">Warehouses</Link>
        </nav>
        <Routes>
          <Route path="/warehouse" element={<WarehouseListPage />} />
          <Route path="/warehouse/:warehouseId" element={<WarehouseDetailsPage />} />
          <Route path="/warehouse/:warehouseId/inventory" element={<InventoryPage />} />
          <Route path="/warehouse/:warehouseId/intake" element={<PackageIntakePage />} />
          <Route path="/warehouse/:warehouseId/dispatch" element={<DispatchPage />} />
          <Route path="/warehouse/:warehouseId/throughput" element={<ThroughputPage />} />
          <Route path="*" element={<Navigate to="/warehouse" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
