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
    <section>
      <h1>Inventory</h1>
      <p><Link to={`/warehouse/${warehouseId}`}>Back to warehouse</Link></p>
      <fieldset><legend>Server-side filters</legend>
        <label>Status <select value={status} onChange={(event) => updateFilter(() => setStatus(event.target.value as PackageStatus | ''))}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Storage zone <select value={storageZoneId} onChange={(event) => updateFilter(() => setStorageZoneId(event.target.value))}><option value="">All zones</option>{zones.data?.map((zone) => <option key={zone.id} value={zone.id}>{zone.code} — {zone.name}</option>)}</select></label>
        <label>Tracking code <input value={trackingCode} onChange={(event) => updateFilter(() => setTrackingCode(event.target.value))} /></label>
      </fieldset>
      {availabilityError && <ApiMessage kind="error">{availabilityError}</ApiMessage>}
      {inventory.isLoading ? <ApiMessage>Loading inventory…</ApiMessage> : inventory.error ? <ApiMessage kind="error">{userFacingApiError(inventory.error, 'Inventory could not be loaded.')}</ApiMessage> : !inventory.data?.items.length ? <ApiMessage>No packages match the current server-side filters.</ApiMessage> : (
        <>
          <InventoryTable packages={inventory.data.items} zones={zones.data ?? []} availabilityPendingId={availability.isLoading ? availability.originalArgs : undefined} onMakeAvailable={makePackageAvailable} />
          <p>Page {inventory.data.page} of {inventory.data.totalPages || 1} ({inventory.data.totalCount} packages)</p>
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <button type="button" disabled={page >= inventory.data.totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </>
      )}
    </section>
  )
}
