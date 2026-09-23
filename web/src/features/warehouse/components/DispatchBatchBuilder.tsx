import { useState, type FormEvent } from 'react'

import {
  useCreateDispatchBatchMutation,
  type DispatchBatchCreationResponse,
  type StorageZone,
  type WarehousePackage,
} from '../warehouseApi'
import { ApiMessage, userFacingApiError } from './ApiMessage'
import { CapacityIndicator } from './CapacityIndicator'

interface DispatchBatchBuilderProps {
  warehouseId: string
  packages: WarehousePackage[]
  zones: StorageZone[]
  onBatchCreated: (batchId: string) => void
}

export function DispatchBatchBuilder({ warehouseId, packages, zones, onBatchCreated }: DispatchBatchBuilderProps) {
  const [createBatch, { isLoading }] = useCreateDispatchBatchMutation()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [vehicle, setVehicle] = useState({ vehicleId: '', maxWeightKg: '', maxVolumeM3: '' })
  const [response, setResponse] = useState<DispatchBatchCreationResponse>()
  const [error, setError] = useState<string>()
  const zonesById = new Map(zones.map((zone) => [zone.id, zone.code]))
  const selected = packages.filter((item) => selectedIds.includes(item.id))

  const togglePackage = (packageId: string) => {
    setSelectedIds((current) => current.includes(packageId)
      ? current.filter((id) => id !== packageId)
      : [...current, packageId])
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)
    setResponse(undefined)
    const maxWeightKg = Number(vehicle.maxWeightKg)
    const maxVolumeM3 = Number(vehicle.maxVolumeM3)
    if (!vehicle.vehicleId.trim() || maxWeightKg <= 0 || maxVolumeM3 <= 0 || selectedIds.length === 0) {
      setError('Select at least one package and provide a vehicle ID with positive temporary capacity values.')
      return
    }
    try {
      const result = await createBatch({
        warehouseId,
        vehicleId: vehicle.vehicleId.trim(),
        maxWeightKg,
        maxVolumeM3,
        packageIds: selectedIds,
      }).unwrap()
      setResponse(result)
      if (result.result === 'PASS' && result.batch) onBatchCreated(result.batch.id)
    } catch (requestError) {
      setError(userFacingApiError(requestError, 'The dispatch batch could not be created.'))
    }
  }

  return (
    <section>
      <h2>Create dispatch batch</h2>
      <p>Only packages returned by the backend as Available are shown. Safety validation remains backend-authoritative.</p>
      <form onSubmit={submit} noValidate>
        <fieldset>
          <legend>Temporary S2 vehicle allocation inputs</legend>
          <p><small>Replace these development-only values with the S2 vehicle selector when that contract is available.</small></p>
          <label>Vehicle ID<input value={vehicle.vehicleId} onChange={(event) => setVehicle({ ...vehicle, vehicleId: event.target.value })} required /></label>
          <label>Max weight (kg)<input type="number" min="0.01" step="any" value={vehicle.maxWeightKg} onChange={(event) => setVehicle({ ...vehicle, maxWeightKg: event.target.value })} required /></label>
          <label>Max volume (m³)<input type="number" min="0.01" step="any" value={vehicle.maxVolumeM3} onChange={(event) => setVehicle({ ...vehicle, maxVolumeM3: event.target.value })} required /></label>
        </fieldset>
        <table>
          <thead><tr><th>Select</th><th>Tracking</th><th>Zone</th><th>Weight</th><th>Volume</th><th>Fragile</th><th>Status</th></tr></thead>
          <tbody>
            {packages.map((item) => (
              <tr key={item.id}>
                <td><input aria-label={`Select ${item.trackingCode}`} type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => togglePackage(item.id)} /></td>
                <td>{item.trackingCode}</td><td>{zonesById.get(item.storageZoneId) ?? item.storageZoneId}</td>
                <td>{item.weightKg} kg</td><td>{item.volumeM3} m³</td><td>{item.isFragile ? 'Yes' : 'No'}</td><td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {packages.length === 0 && <ApiMessage>No Available packages were returned by the inventory API.</ApiMessage>}
        <button type="submit" disabled={isLoading}>{isLoading ? 'Planning…' : 'Create batch'}</button>
      </form>
      {error && <ApiMessage kind="error">{error}</ApiMessage>}
      {response && <BatchCreationResult response={response} />}
      {response?.batch && (
        <>
          <CapacityIndicator label="Batch weight" occupied={response.batch.totalWeightKg} total={response.batch.maxWeightKg} unit="kg" />
          <CapacityIndicator label="Batch volume" occupied={response.batch.totalVolumeM3} total={response.batch.maxVolumeM3} unit="m³" />
        </>
      )}
      {selected.length > 0 && <p>{selected.length} package(s) selected.</p>}
    </section>
  )
}

function BatchCreationResult({ response }: { response: DispatchBatchCreationResponse }) {
  const kind = response.result === 'PASS' ? 'success' : 'error'
  const heading = response.result === 'PASS'
    ? 'Batch created successfully.'
    : response.result === 'REVISE'
      ? 'Batch requires revision; no partial batch was created.'
      : 'Batch creation failed validation.'
  return (
    <section aria-label="Batch creation result">
      <ApiMessage kind={kind}>{heading}</ApiMessage>
      {response.issues.length > 0 && <ul>{response.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
      {response.batch && (
        <table>
          <caption>Backend-generated load sequence</caption>
          <thead><tr><th>Load sequence</th><th>Tracking code</th><th>Weight</th><th>Volume</th><th>Fragile</th></tr></thead>
          <tbody>{response.batch.items.map((item) => (
            <tr key={item.packageId}><td>{item.loadSequence}</td><td>{item.trackingCode}</td><td>{item.weightKg} kg</td><td>{item.volumeM3} m³</td><td>{item.isFragile ? 'Yes' : 'No'}</td></tr>
          ))}</tbody>
        </table>
      )}
    </section>
  )
}
