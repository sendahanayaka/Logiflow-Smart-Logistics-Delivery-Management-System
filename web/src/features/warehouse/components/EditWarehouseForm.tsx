import { useState, type FormEvent } from 'react'

import { useUpdateWarehouseMutation, type Warehouse } from '../warehouseApi'
import { ApiMessage, userFacingApiError } from './ApiMessage'

interface EditWarehouseFormProps {
  warehouse: Warehouse
  onClose: () => void
}

export function EditWarehouseForm({ warehouse, onClose }: EditWarehouseFormProps) {
  const [updateWarehouse, { isLoading }] = useUpdateWarehouseMutation()
  const [form, setForm] = useState({
    name: warehouse.name,
    location: warehouse.location,
    totalVolumeM3: String(warehouse.totalVolumeM3),
  })
  const [error, setError] = useState<string>()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)

    const totalVolumeM3 = Number(form.totalVolumeM3)
    if (!form.name.trim() || !form.location.trim() || !Number.isFinite(totalVolumeM3) || totalVolumeM3 <= 0) {
      setError('Warehouse name, location, and a positive total volume are required.')
      return
    }
    if (totalVolumeM3 < warehouse.occupiedVolumeM3) {
      setError(`Total volume cannot be below the occupied volume (${warehouse.occupiedVolumeM3} m³).`)
      return
    }

    try {
      await updateWarehouse({
        warehouseId: warehouse.id,
        body: { name: form.name.trim(), location: form.location.trim(), totalVolumeM3 },
      }).unwrap()
      onClose()
    } catch (requestError) {
      setError(userFacingApiError(requestError, 'The warehouse could not be updated. Please try again.'))
    }
  }

  return (
    <section className="create-warehouse-card" aria-labelledby="edit-warehouse-heading">
      <div>
        <p className="eyebrow">Edit warehouse</p>
        <h2 id="edit-warehouse-heading">Update {warehouse.name}</h2>
      </div>
      <form className="warehouse-form" onSubmit={submit} noValidate>
        <label>
          Warehouse name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label>
          Location
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required />
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
