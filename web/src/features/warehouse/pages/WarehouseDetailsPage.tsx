import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { CapacityIndicator } from '../components/CapacityIndicator'
import { CreateStorageZoneForm } from '../components/CreateStorageZoneForm'
import { EditWarehouseForm } from '../components/EditWarehouseForm'
import { EditStorageZoneForm } from '../components/EditStorageZoneForm'
import { useGetStorageZonesQuery, useGetWarehouseQuery } from '../warehouseApi'
import '../../portals/Portal.css'

export function WarehouseDetailsPage() {
  const { warehouseId } = useParams()
  const skip = !warehouseId
  const warehouse = useGetWarehouseQuery(warehouseId ?? '', { skip })
  const zones = useGetStorageZonesQuery(warehouseId ?? '', { skip })
  const [editingWarehouse, setEditingWarehouse] = useState(false)
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)

  if (skip) return <ApiMessage kind="error">A warehouse identifier is required.</ApiMessage>
  if (warehouse.isLoading || zones.isLoading) return <ApiMessage>Loading warehouse details…</ApiMessage>
  if (warehouse.error) return <ApiMessage kind="error">{userFacingApiError(warehouse.error, 'Warehouse details could not be loaded.')}</ApiMessage>
  if (zones.error) return <ApiMessage kind="error">{userFacingApiError(zones.error, 'Storage zones could not be loaded.')}</ApiMessage>
  if (!warehouse.data) return null

  const editingZone = zones.data?.find((zone) => zone.id === editingZoneId)

  return (
    <section className="warehouse-page">
      <Link className="back-link" to="/warehouse">← All warehouses</Link>
      <div className="detail-hero">
        <div>
          <p className="eyebrow">Warehouse operations</p>
          <h1>{warehouse.data.name}</h1>
          <p>{warehouse.data.location}</p>
          <button type="button" className="secondary" onClick={() => setEditingWarehouse((value) => !value)}>
            {editingWarehouse ? 'Close editor' : 'Edit warehouse'}
          </button>
        </div>
        <div className="hero-capacity">
          <CapacityIndicator label="Warehouse volume" occupied={warehouse.data.occupiedVolumeM3} total={warehouse.data.totalVolumeM3} unit="m³" />
        </div>
      </div>
      {editingWarehouse && <EditWarehouseForm warehouse={warehouse.data} onClose={() => setEditingWarehouse(false)} />}
      <nav className="action-nav" aria-label="Warehouse actions">
        <Link to={`/warehouse/${warehouseId}/inventory`}><strong>Inventory</strong><span>Search and update package state</span></Link>
        <Link to={`/warehouse/${warehouseId}/intake`}><strong>Package intake</strong><span>Receive packages into a zone</span></Link>
        <Link to={`/warehouse/${warehouseId}/dispatch`}><strong>Dispatch</strong><span>Build and validate vehicle loads</span></Link>
        <Link to={`/warehouse/${warehouseId}/throughput`}><strong>Throughput</strong><span>Review date-range metrics</span></Link>
      </nav>

      <div className="section-header-inline fade-in-up" style={{ animationDelay: '100ms' }}>
        <h2>Storage Zones</h2>
      </div>

      {!zones.data?.length ? <div className="empty-state"><h3>No Storage Zones</h3><p>No storage zones are configured for this warehouse.</p></div> : (
        <div className="warehouse-grid fade-in-up" style={{ animationDelay: '150ms' }}>
          {zones.data.map((zone) => (
            <article className="warehouse-card" key={zone.id}>
              <div className="card-header">
                <div className="card-icon">📦</div>
                <h3>{zone.name}</h3>
              </div>
              <p style={{ color: '#6B7280', fontWeight: 'bold', marginBottom: '1rem' }}>Zone Code: {zone.code}</p>
              <CapacityIndicator label="Zone volume" occupied={zone.occupiedVolumeM3} total={zone.totalVolumeM3} unit="m³" />
              <button type="button" className="secondary" onClick={() => setEditingZoneId(zone.id)}>Edit zone</button>
            </article>
          ))}
        </div>
      )}
      {editingZone && warehouseId && (
        <EditStorageZoneForm warehouseId={warehouseId} zone={editingZone} onClose={() => setEditingZoneId(null)} />
      )}
      <CreateStorageZoneForm warehouseId={warehouseId} />
    </section>
  )
}
