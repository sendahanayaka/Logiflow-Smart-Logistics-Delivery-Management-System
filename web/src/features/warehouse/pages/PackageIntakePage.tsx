import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { PackageIntakeForm } from '../components/PackageIntakeForm'
import { useGetStorageZonesQuery, useGetWarehouseQuery } from '../warehouseApi'
import '../../portals/Portal.css'

export function PackageIntakePage() {
  const { warehouseId } = useParams()
  const skip = !warehouseId
  const warehouse = useGetWarehouseQuery(warehouseId ?? '', { skip })
  const zones = useGetStorageZonesQuery(warehouseId ?? '', { skip })
  if (skip) return <ApiMessage kind="error">A warehouse identifier is required.</ApiMessage>
  if (warehouse.isLoading || zones.isLoading) return <div className="portal-container"><div className="loading-state"><span className="spinner"></span><p>Loading package intake…</p></div></div>
  if (warehouse.error || zones.error) return <ApiMessage kind="error">{userFacingApiError(warehouse.error ?? zones.error, 'Package intake prerequisites could not be loaded.')}</ApiMessage>
  if (!warehouse.data) return null
  return (
    <div className="portal-container">
      <Link className="btn-primary-outline" to={`/warehouse/${warehouseId}`} style={{ display: 'inline-block', marginBottom: '2rem' }}>← Back to warehouse</Link>

      <header className="portal-header fade-in-up">
        <span className="portal-role-badge">INBOUND OPERATIONS</span>
        <h1>Package Intake</h1>
        <div className="portal-divider"></div>
        <p>Receive a package into {warehouse.data.name} and assign its storage zone.</p>
      </header>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Link className="throughput-link" to={`/warehouse/${warehouseId}/inventory`}>View current inventory →</Link>
      </div>

      {!zones.data?.length ? (
        <div className="empty-state">
          <h2>No Storage Zones</h2>
          <p>Create a storage zone before receiving packages.</p>
        </div>
      ) : (
        <PackageIntakeForm warehouseId={warehouseId} zones={zones.data} />
      )}
    </div>
  )
}
