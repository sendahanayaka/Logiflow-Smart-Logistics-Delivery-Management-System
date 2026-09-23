import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { DispatchBatchBuilder } from '../components/DispatchBatchBuilder'
import { ValidationResult } from '../components/ValidationResult'
import { useGetPackagesQuery, useGetStorageZonesQuery } from '../warehouseApi'

export function DispatchPage() {
  const { warehouseId } = useParams()
  const [batchId, setBatchId] = useState<string>()
  const skip = !warehouseId
  const availablePackages = useGetPackagesQuery(
    { warehouseId: warehouseId ?? '', page: 1, pageSize: 100, status: 'Available' },
    { skip },
  )
  const zones = useGetStorageZonesQuery(warehouseId ?? '', { skip })

  if (skip) return <ApiMessage kind="error">A warehouse identifier is required.</ApiMessage>
  if (availablePackages.isLoading || zones.isLoading) return <ApiMessage>Loading available packages…</ApiMessage>
  if (availablePackages.error || zones.error) return <ApiMessage kind="error">{userFacingApiError(availablePackages.error ?? zones.error, 'Dispatch prerequisites could not be loaded.')}</ApiMessage>
  return (
    <section>
      <h1>Dispatch batch builder</h1>
      <p><Link to={`/warehouse/${warehouseId}`}>Back to warehouse</Link></p>
      <DispatchBatchBuilder warehouseId={warehouseId} packages={availablePackages.data?.items ?? []} zones={zones.data ?? []} onBatchCreated={setBatchId} />
      {batchId && <ValidationResult batchId={batchId} />}
    </section>
  )
}
