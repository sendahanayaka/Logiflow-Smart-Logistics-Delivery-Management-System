import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCreateWarehouseMutation } from '../warehouseApi'
import { ApiMessage, userFacingApiError } from './ApiMessage'

export function CreateWarehouseForm() {
  const navigate = useNavigate()
  const [createWarehouse, { isLoading }] = useCreateWarehouseMutation()
  const [form, setForm] = useState({ name: '', location: '', totalVolumeM3: '' })
  const [error, setError] = useState<string>()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)

    const totalVolumeM3 = Number(form.totalVolumeM3)
    if (!form.name.trim() || !form.location.trim() || !Number.isFinite(totalVolumeM3) || totalVolumeM3 <= 0) {
      setError('Warehouse name, location, and a positive total volume are required.')
      return
    }

    try {
      const warehouse = await createWarehouse({
        name: form.name.trim(),
        location: form.location.trim(),
        totalVolumeM3,
      }).unwrap()
      navigate(`/warehouse/${warehouse.id}`)
    } catch (requestError) {
      setError(userFacingApiError(requestError, 'The warehouse could not be created. Please try again.'))
    }
  }

  return (
    <section className="create-warehouse-card" aria-labelledby="create-warehouse-heading">
      <div>
        <p className="eyebrow">Warehouse setup</p>
        <h2 id="create-warehouse-heading">Create a warehouse</h2>
        <p>Add your first operating location to begin managing zones, inventory, and dispatch batches.</p>
      </div>
      <form className="warehouse-form" onSubmit={submit} noValidate>
        <label>
          Warehouse name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Colombo Central" required />
        </label>
        <label>
          Location
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="e.g. Colombo, Sri Lanka" required />
        </label>
        <label>
          Total capacity (m³)
          <input type="number" min="0.01" step="any" value={form.totalVolumeM3} onChange={(event) => setForm({ ...form, totalVolumeM3: event.target.value })} placeholder="e.g. 500" required />
        </label>
        <button type="submit" disabled={isLoading}>{isLoading ? 'Creating warehouse…' : 'Create warehouse'}</button>
      </form>
      {error && <ApiMessage kind="error">{error}</ApiMessage>}
    </section>
  )
}
