import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { CapacityIndicator } from '../components/CapacityIndicator'
import { CreateStorageZoneForm } from '../components/CreateStorageZoneForm'
import { useGetStorageZonesQuery, useGetWarehouseQuery } from '../warehouseApi'

export function WarehouseDetailsPage() {
  const { warehouseId } = useParams()
  const skip = !warehouseId
  const warehouse = useGetWarehouseQuery(warehouseId ?? '', { skip })
  const zones = useGetStorageZonesQuery(warehouseId ?? '', { skip })

  if (skip) return <ApiMessage kind="error">A warehouse identifier is required.</ApiMessage>
  if (warehouse.isLoading || zones.isLoading) return <ApiMessage>Loading warehouse details…</ApiMessage>
  if (warehouse.error) return <ApiMessage kind="error">{userFacingApiError(warehouse.error, 'Warehouse details could not be loaded.')}</ApiMessage>
  if (zones.error) return <ApiMessage kind="error">{userFacingApiError(zones.error, 'Storage zones could not be loaded.')}</ApiMessage>
  if (!warehouse.data) return null

  return (
    <section className="warehouse-page">
      <Link className="back-link" to="/warehouse">← All warehouses</Link>
      <div className="detail-hero">
        <div>
          <p className="eyebrow">Warehouse operations</p>
          <h1>{warehouse.data.name}</h1>
          <p>{warehouse.data.location}</p>
        </div>
        <div className="hero-capacity">
          <CapacityIndicator label="Warehouse volume" occupied={warehouse.data.occupiedVolumeM3} total={warehouse.data.totalVolumeM3} unit="m³" />
        </div>
      </div>
      <nav className="action-nav" aria-label="Warehouse actions">
        <Link to={`/warehouse/${warehouseId}/inventory`}><strong>Inventory</strong><span>Search and update package state</span></Link>
        <Link to={`/warehouse/${warehouseId}/intake`}><strong>Package intake</strong><span>Receive packages into a zone</span></Link>
        <Link to={`/warehouse/${warehouseId}/dispatch`}><strong>Dispatch</strong><span>Build and validate vehicle loads</span></Link>
        <Link to={`/warehouse/${warehouseId}/throughput`}><strong>Throughput</strong><span>Review date-range metrics</span></Link>
      </nav>
      <h2>Storage zones</h2>
      {!zones.data?.length ? <ApiMessage>No storage zones are configured for this warehouse.</ApiMessage> : (
        <div className="zone-grid">
          {zones.data.map((zone) => (
            <article className="zone-card" key={zone.id}>
              <span className="zone-code">{zone.code}</span>
              <h3>{zone.name}</h3>
              <CapacityIndicator label="Zone volume" occupied={zone.occupiedVolumeM3} total={zone.totalVolumeM3} unit="m³" />
            </article>
          ))}
        </div>
      )}
      <CreateStorageZoneForm warehouseId={warehouseId} />
    </section>
  )
}
