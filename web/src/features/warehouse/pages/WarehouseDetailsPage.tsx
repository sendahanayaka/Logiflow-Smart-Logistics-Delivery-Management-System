import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { CapacityIndicator } from '../components/CapacityIndicator'
import { CreateStorageZoneForm } from '../components/CreateStorageZoneForm'
import { useGetStorageZonesQuery, useGetWarehouseQuery } from '../warehouseApi'
import '../../portals/Portal.css'

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
    <div className="portal-container">
      <Link className="btn-primary-outline" to="/warehouse" style={{ display: 'inline-block', marginBottom: '2rem' }}>← All warehouses</Link>

      <header className="portal-header fade-in-up">
        <span className="portal-role-badge">WAREHOUSE OVERVIEW</span>
        <h1>{warehouse.data.name}</h1>
        <div className="portal-divider"></div>
        <p>{warehouse.data.location}</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <CapacityIndicator label="Warehouse volume" occupied={warehouse.data.occupiedVolumeM3} total={warehouse.data.totalVolumeM3} unit="m³" />
        </div>
      </header>

      <nav className="action-nav create-warehouse-card fade-in-up" aria-label="Warehouse actions" style={{ marginTop: 0, marginBottom: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link className="action-btn" to={`/warehouse/${warehouseId}/inventory`} style={{ textDecoration: 'none' }}><strong>Inventory</strong><br /><span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>Search and update package state</span></Link>
        <Link className="action-btn" to={`/warehouse/${warehouseId}/intake`} style={{ textDecoration: 'none' }}><strong>Package intake</strong><br /><span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>Receive packages into a zone</span></Link>
        <Link className="action-btn" to={`/warehouse/${warehouseId}/dispatch`} style={{ textDecoration: 'none' }}><strong>Dispatch</strong><br /><span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>Build and validate vehicle loads</span></Link>
        <Link className="action-btn" to={`/warehouse/${warehouseId}/throughput`} style={{ textDecoration: 'none' }}><strong>Throughput</strong><br /><span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>Review date-range metrics</span></Link>
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
            </article>
          ))}
        </div>
      )}
      <div className="fade-in-up" style={{ animationDelay: '200ms' }}>
        <CreateStorageZoneForm warehouseId={warehouseId} />
      </div>
    </div>
  )
}
