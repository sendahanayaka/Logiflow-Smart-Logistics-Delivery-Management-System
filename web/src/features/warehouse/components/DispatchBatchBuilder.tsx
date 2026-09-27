import { useState, type FormEvent } from 'react'

import {
  useCreateDispatchBatchMutation,
  useReplaceDispatchBatchItemsMutation,
  useValidateDispatchCandidateMutation,
  type DispatchCandidateAgentValidationResponse,
  type DispatchBatch,
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
  const [replaceBatchItems, replaceState] = useReplaceDispatchBatchItemsMutation()
  const [validateCandidate, validationState] = useValidateDispatchCandidateMutation()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [vehicle, setVehicle] = useState({ vehicleId: '', maxWeightKg: '', maxVolumeM3: '' })
  const [response, setResponse] = useState<DispatchBatchCreationResponse>()
  const [activeBatch, setActiveBatch] = useState<DispatchBatch>()
  const [reservedPackageSnapshot, setReservedPackageSnapshot] = useState<WarehousePackage[]>([])
  const [error, setError] = useState<string>()
  const [candidateValidation, setCandidateValidation] = useState<DispatchCandidateAgentValidationResponse>()
  const [validatedCandidateKey, setValidatedCandidateKey] = useState<string>()
  const zonesById = new Map(zones.map((zone) => [zone.id, zone.code]))
  const selectablePackages = [
    ...reservedPackageSnapshot,
    ...packages.filter((item) => !reservedPackageSnapshot.some((reserved) => reserved.id === item.id)),
  ]
  const selected = selectablePackages.filter((item) => selectedIds.includes(item.id))
  const requestPending = isLoading || replaceState.isLoading || validationState.isLoading
  const selectedWeightKg = selected.reduce((total, item) => total + item.weightKg, 0)
  const selectedVolumeM3 = selected.reduce((total, item) => total + item.volumeM3, 0)
  const candidateKey = JSON.stringify({
    packageIds: [...selectedIds].sort(),
    vehicleId: vehicle.vehicleId.trim(),
    maxWeightKg: vehicle.maxWeightKg,
    maxVolumeM3: vehicle.maxVolumeM3,
  })

  const clearCandidateValidation = () => {
    setCandidateValidation(undefined)
    setValidatedCandidateKey(undefined)
  }

  const togglePackage = (packageId: string) => {
    clearCandidateValidation()
    setSelectedIds((current) => current.includes(packageId)
      ? current.filter((id) => id !== packageId)
      : [...current, packageId])
  }

  const validateOrUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)
    setResponse(undefined)
    const maxWeightKg = Number(vehicle.maxWeightKg)
    const maxVolumeM3 = Number(vehicle.maxVolumeM3)
    if (
      !vehicle.vehicleId.trim()
      || !Number.isFinite(maxWeightKg)
      || !Number.isFinite(maxVolumeM3)
      || maxWeightKg <= 0
      || maxVolumeM3 <= 0
      || selectedIds.length === 0
    ) {
      setError('Select at least one package and provide a vehicle ID with positive temporary capacity values.')
      return
    }
    try {
      if (!activeBatch) {
        const validation = await validateCandidate({
          warehouseId,
          packageIds: selectedIds,
          orderIds: selected.map((item) => item.orderId),
          vehicleId: vehicle.vehicleId.trim(),
          maxWeightKg,
          maxVolumeM3,
        }).unwrap()
        setCandidateValidation(validation)
        setValidatedCandidateKey(validation.result === 'PASS' ? candidateKey : undefined)
        return
      }

      const result = await replaceBatchItems({
            batchId: activeBatch.id,
            body: { packageIds: selectedIds },
          }).unwrap()
      setResponse(result)
      if (result.result === 'PASS' && result.batch) {
        setActiveBatch(result.batch)
        setReservedPackageSnapshot(selected.map((item) => ({ ...item, status: 'Reserved' })))
        onBatchCreated(result.batch.id)
      }
    } catch (requestError) {
      setError(userFacingApiError(requestError, 'The dispatch batch could not be created.'))
    }
  }

  const createReservedBatch = async () => {
    if (candidateValidation?.result !== 'PASS' || validatedCandidateKey !== candidateKey) {
      setError('Validate the unchanged candidate successfully before creating a reserved batch.')
      return
    }
    setError(undefined)
    try {
      const result = await createBatch({
        warehouseId,
        vehicleId: vehicle.vehicleId.trim(),
        maxWeightKg: Number(vehicle.maxWeightKg),
        maxVolumeM3: Number(vehicle.maxVolumeM3),
        packageIds: selectedIds,
      }).unwrap()
      setResponse(result)
      if (result.result === 'PASS' && result.batch) {
        setActiveBatch(result.batch)
        setReservedPackageSnapshot(selected.map((item) => ({ ...item, status: 'Reserved' })))
        onBatchCreated(result.batch.id)
      }
    } catch (requestError) {
      setError(userFacingApiError(requestError, 'The reserved dispatch batch could not be created.'))
    }
  }

  return (
    <section className="surface workflow-section">
      <h2>Create dispatch batch</h2>
      <p>Validate the proposed allocation through the S3 safety agent before reserving any package. Only Available packages are shown.</p>
      {activeBatch && (
        <ApiMessage kind="info">
          Editing reserved batch {activeBatch.id}. Existing batch packages remain selectable while reserved.
        </ApiMessage>
      )}
      <form className="stacked-form" onSubmit={validateOrUpdate} noValidate>
        <fieldset>
          <legend>Temporary S2 vehicle allocation inputs</legend>
          <p><small>Replace these development-only values with the S2 vehicle selector when that contract is available.</small></p>
          <div className="form-grid">
            <label>Vehicle ID<input value={vehicle.vehicleId} onChange={(event) => { clearCandidateValidation(); setVehicle({ ...vehicle, vehicleId: event.target.value }) }} disabled={!!activeBatch} required /></label>
            <label>Max weight (kg)<input type="number" min="0.01" step="any" value={vehicle.maxWeightKg} onChange={(event) => { clearCandidateValidation(); setVehicle({ ...vehicle, maxWeightKg: event.target.value }) }} disabled={!!activeBatch} required /></label>
            <label>Max volume (m³)<input type="number" min="0.01" step="any" value={vehicle.maxVolumeM3} onChange={(event) => { clearCandidateValidation(); setVehicle({ ...vehicle, maxVolumeM3: event.target.value }) }} disabled={!!activeBatch} required /></label>
          </div>
        </fieldset>
        <table>
          <thead><tr><th>Select</th><th>Tracking</th><th>Zone</th><th>Weight</th><th>Volume</th><th>Fragile</th><th>Status</th></tr></thead>
          <tbody>
            {selectablePackages.map((item) => (
              <tr key={item.id}>
                <td><input aria-label={`Select ${item.trackingCode}`} type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => togglePackage(item.id)} /></td>
                <td>{item.trackingCode}</td><td>{zonesById.get(item.storageZoneId) ?? item.storageZoneId}</td>
                <td>{item.weightKg} kg</td><td>{item.volumeM3} m³</td><td>{item.isFragile ? 'Yes' : 'No'}</td><td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectablePackages.length === 0 && <ApiMessage>No Available packages were returned by the inventory API.</ApiMessage>}
        {selected.length > 0 && <p>Candidate summary: {selected.length} package(s), {selectedWeightKg} kg, {selectedVolumeM3} m³.</p>}
        <button type="submit" disabled={requestPending}>
          {requestPending ? 'Validating…' : activeBatch ? 'Update batch items' : 'Validate allocation'}
        </button>
      </form>
      {error && <ApiMessage kind="error">{error}</ApiMessage>}
      {candidateValidation && <CandidateValidationResult response={candidateValidation} />}
      {!activeBatch && candidateValidation?.result === 'PASS' && validatedCandidateKey === candidateKey && (
        <button type="button" onClick={createReservedBatch} disabled={requestPending}>Create reserved batch</button>
      )}
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

function CandidateValidationResult({ response }: { response: DispatchCandidateAgentValidationResponse }) {
  const kind = response.result === 'PASS' ? 'success' : response.result === 'REVISE' ? 'info' : 'error'
  return (
    <section className="agent-result" aria-label="S3 candidate validation result">
      <ApiMessage kind={kind}>S3 Load & Dispatch Validation: {response.result}</ApiMessage>
      {response.agentMessage && <ApiMessage kind="info">{response.agentMessage}</ApiMessage>}
      {response.rejectionReasons.length > 0 && <ul>{response.rejectionReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
      {response.explanation && <blockquote className="agent-explanation">{response.explanation}</blockquote>}
      {response.explanationSource && <p className="agent-source">{response.explanationSource === 'ollama' ? 'Explanation generated by Ollama after deterministic validation.' : 'Deterministic fallback explanation; the decision is unchanged.'}</p>}
      {response.ruleResults.length > 0 && <ul className="validation-rules">{response.ruleResults.map((rule) => (
        <li className={rule.passed ? 'rule-pass' : 'rule-fail'} key={rule.rule}><span>{rule.passed ? '✓' : '×'}</span><strong>{rule.rule.split('_').join(' ')}:</strong> {rule.detail ?? (rule.passed ? 'Passed' : 'Failed')}</li>
      ))}</ul>}
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
