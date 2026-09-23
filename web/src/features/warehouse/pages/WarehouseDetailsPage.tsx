import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { CapacityIndicator } from '../components/CapacityIndicator'
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
    <section>
      <h1>{warehouse.data.name}</h1>
      <p>{warehouse.data.location}</p>
      <CapacityIndicator label="Warehouse volume" occupied={warehouse.data.occupiedVolumeM3} total={warehouse.data.totalVolumeM3} unit="m³" />
      <p>
        <Link to={`/warehouse/${warehouseId}/inventory`}>Inventory</Link>{' · '}
        <Link to={`/warehouse/${warehouseId}/intake`}>Package intake</Link>{' · '}
        <Link to={`/warehouse/${warehouseId}/dispatch`}>Dispatch</Link>{' · '}
        <Link to={`/warehouse/${warehouseId}/throughput`}>Throughput</Link>
      </p>
      <h2>Storage zones</h2>
      {!zones.data?.length ? <ApiMessage>No storage zones are configured for this warehouse.</ApiMessage> : (
        <table>
          <thead><tr><th>Code</th><th>Name</th><th>Occupied volume</th><th>Total volume</th></tr></thead>
          <tbody>{zones.data.map((zone) => (
            <tr key={zone.id}><td>{zone.code}</td><td>{zone.name}</td><td>{zone.occupiedVolumeM3} m³</td><td>{zone.totalVolumeM3} m³</td></tr>
          ))}</tbody>
        </table>
      )}
    </section>
  )
}
