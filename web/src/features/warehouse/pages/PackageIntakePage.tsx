import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { PackageIntakeForm } from '../components/PackageIntakeForm'
import { useGetStorageZonesQuery, useGetWarehouseQuery } from '../warehouseApi'

export function PackageIntakePage() {
  const { warehouseId } = useParams()
  const skip = !warehouseId
  const warehouse = useGetWarehouseQuery(warehouseId ?? '', { skip })
  const zones = useGetStorageZonesQuery(warehouseId ?? '', { skip })
  if (skip) return <ApiMessage kind="error">A warehouse identifier is required.</ApiMessage>
  if (warehouse.isLoading || zones.isLoading) return <ApiMessage>Loading package intake…</ApiMessage>
  if (warehouse.error || zones.error) return <ApiMessage kind="error">{userFacingApiError(warehouse.error ?? zones.error, 'Package intake prerequisites could not be loaded.')}</ApiMessage>
  if (!warehouse.data) return null
  return (
    <section>
      <h1>Package intake — {warehouse.data.name}</h1>
      <p><Link to={`/warehouse/${warehouseId}/inventory`}>View inventory</Link></p>
      {!zones.data?.length ? <ApiMessage kind="error">Create a storage zone before receiving packages.</ApiMessage> : <PackageIntakeForm warehouseId={warehouseId} zones={zones.data} />}
    </section>
  )
}
