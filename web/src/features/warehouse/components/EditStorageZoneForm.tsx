import { useState, type FormEvent } from 'react'

import { useUpdateStorageZoneMutation, type StorageZone } from '../warehouseApi'
import { ApiMessage, userFacingApiError } from './ApiMessage'

interface EditStorageZoneFormProps {
  warehouseId: string
  zone: StorageZone
  onClose: () => void
}

export function EditStorageZoneForm({ warehouseId, zone, onClose }: EditStorageZoneFormProps) {
  const [updateZone, { isLoading }] = useUpdateStorageZoneMutation()
  const [form, setForm] = useState({
    name: zone.name,
    code: zone.code,
    totalVolumeM3: String(zone.totalVolumeM3),
  })
  const [error, setError] = useState<string>()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)

    const totalVolumeM3 = Number(form.totalVolumeM3)
    if (!form.name.trim() || !form.code.trim() || !Number.isFinite(totalVolumeM3) || totalVolumeM3 <= 0) {
      setError('Zone name, code, and a positive total volume are required.')
      return
    }
    if (totalVolumeM3 < zone.occupiedVolumeM3) {
      setError(`Total volume cannot be below the occupied volume (${zone.occupiedVolumeM3} m³).`)
      return
    }

    try {
      await updateZone({
        warehouseId,
        zoneId: zone.id,
        body: { name: form.name.trim(), code: form.code.trim(), totalVolumeM3 },
      }).unwrap()
      onClose()
    } catch (requestError) {
      setError(userFacingApiError(requestError, 'The storage zone could not be updated. Please try again.'))
    }
  }

  return (
    <section className="create-warehouse-card" aria-labelledby="edit-zone-heading">
      <div>
        <p className="eyebrow">Edit storage zone</p>
        <h2 id="edit-zone-heading">Update zone {zone.code}</h2>
      </div>
      <form className="warehouse-form" onSubmit={submit} noValidate>
        <label>
          Zone name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label>
          Zone code
          <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
        </label>
        <label>
          Total capacity (m³)
          <input type="number" min="0.01" step="any" value={form.totalVolumeM3} onChange={(event) => setForm({ ...form, totalVolumeM3: event.target.value })} required />
        </label>
        <div className="form-actions">
          <button type="submit" disabled={isLoading}>{isLoading ? 'Saving…' : 'Save changes'}</button>
          <button type="button" className="secondary" onClick={onClose} disabled={isLoading}>Cancel</button>
        </div>
      </form>
      {error && <ApiMessage kind="error">{error}</ApiMessage>}
    </section>
  )
}
