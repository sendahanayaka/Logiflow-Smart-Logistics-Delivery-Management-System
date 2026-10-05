import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { InventoryTable } from '../components/InventoryTable'
import {
  useGetPackagesQuery,
  useGetStorageZonesQuery,
  useMakePackageAvailableMutation,
  type PackageStatus,
} from '../warehouseApi'
import '../../portals/Portal.css'

const statuses: PackageStatus[] = ['Received', 'Available', 'Reserved', 'Dispatched', 'OnHold']

export function InventoryPage() {
  const { warehouseId } = useParams()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<PackageStatus | ''>('')
  const [storageZoneId, setStorageZoneId] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [availabilityError, setAvailabilityError] = useState<string>()
  const skip = !warehouseId
  const inventory = useGetPackagesQuery({
    warehouseId: warehouseId ?? '', page, pageSize: 20,
    status: status || undefined, storageZoneId: storageZoneId || undefined, trackingCode: trackingCode || undefined,
  }, { skip })
  const zones = useGetStorageZonesQuery(warehouseId ?? '', { skip })
  const [makeAvailable, availability] = useMakePackageAvailableMutation()

  const updateFilter = (update: () => void) => { update(); setPage(1) }
  const makePackageAvailable = async (packageId: string) => {
    setAvailabilityError(undefined)
    try { await makeAvailable(packageId).unwrap() } catch (error) { setAvailabilityError(userFacingApiError(error)) }
  }

  if (skip) return <ApiMessage kind="error">A warehouse identifier is required.</ApiMessage>
  return (
    <div className="portal-container">
      <Link className="btn-primary-outline" to={`/warehouse/${warehouseId}`} style={{ display: 'inline-block', marginBottom: '2rem' }}>← Back to warehouse</Link>

      <header className="portal-header fade-in-up">
        <span className="portal-role-badge">STOCK CONTROL</span>
        <h1>Global Inventory</h1>
        <div className="portal-divider"></div>
        <p>Filter server-side inventory and release logically-received packages for dispatch.</p>
      </header>

      <div className="create-warehouse-card fade-in-up" style={{ marginTop: 0 }}>
        <fieldset className="warehouse-form" style={{ border: 'none', padding: 0, margin: 0, marginBottom: '2rem' }}>
          <legend style={{ color: 'var(--color-navy, #08006C)', fontWeight: 'bold', marginBottom: '1rem' }}>Server-side filters</legend>
          <label>Status <select value={status} onChange={(event) => updateFilter(() => setStatus(event.target.value as PackageStatus | ''))}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Storage zone <select value={storageZoneId} onChange={(event) => updateFilter(() => setStorageZoneId(event.target.value))}><option value="">All zones</option>{zones.data?.map((zone) => <option key={zone.id} value={zone.id}>{zone.code} — {zone.name}</option>)}</select></label>
          <label>Tracking code <input value={trackingCode} onChange={(event) => updateFilter(() => setTrackingCode(event.target.value))} placeholder="Search tracking code" /></label>
        </fieldset>

        {availabilityError && <ApiMessage kind="error">{availabilityError}</ApiMessage>}
        {inventory.isLoading ? <div className="loading-state"><span className="spinner"></span><p>Loading inventory…</p></div> : inventory.error ? <ApiMessage kind="error">{userFacingApiError(inventory.error, 'Inventory could not be loaded.')}</ApiMessage> : !inventory.data?.items.length ? <ApiMessage>No packages match the current server-side filters.</ApiMessage> : (
          <>
            <InventoryTable packages={inventory.data.items} zones={zones.data ?? []} availabilityPendingId={availability.isLoading ? availability.originalArgs : undefined} onMakeAvailable={makePackageAvailable} />
            <div className="pagination-row" style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#6B7280' }}>Page {inventory.data.page} of {inventory.data.totalPages || 1} ({inventory.data.totalCount} packages)</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn-solid-orange" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                <button className="btn-solid-orange" type="button" disabled={page >= inventory.data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
