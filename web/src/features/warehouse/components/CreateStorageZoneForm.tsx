import { useState, type FormEvent } from 'react'

import { useCreateStorageZoneMutation } from '../warehouseApi'
import { ApiMessage, userFacingApiError } from './ApiMessage'

interface CreateStorageZoneFormProps {
  warehouseId: string
}

export function CreateStorageZoneForm({ warehouseId }: CreateStorageZoneFormProps) {
  const [createStorageZone, { isLoading }] = useCreateStorageZoneMutation()
  const [form, setForm] = useState({ name: '', code: '', totalVolumeM3: '' })
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(undefined)
    setError(undefined)

    const totalVolumeM3 = Number(form.totalVolumeM3)
    if (!form.name.trim() || !form.code.trim() || !Number.isFinite(totalVolumeM3) || totalVolumeM3 <= 0) {
      setError('Zone name, code, and a positive total volume are required.')
      return
    }

    try {
      await createStorageZone({
        warehouseId,
        body: { name: form.name.trim(), code: form.code.trim(), totalVolumeM3 },
      }).unwrap()
      setForm({ name: '', code: '', totalVolumeM3: '' })
      setMessage('Storage zone created successfully.')
    } catch (requestError) {
      setError(userFacingApiError(requestError, 'The storage zone could not be created. Please try again.'))
    }
  }

  return (
    <section className="create-warehouse-card" aria-labelledby="create-zone-heading">
      <div>
        <p className="eyebrow">Storage setup</p>
        <h2 id="create-zone-heading">Add a storage zone</h2>
        <p>Zones let LogiFlow track where each package is stored and prevent capacity conflicts.</p>
      </div>
      <form className="warehouse-form" onSubmit={submit} noValidate>
        <label>
          Zone name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Cold storage" required />
        </label>
        <label>
          Zone code
          <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="e.g. COLD-01" required />
        </label>
        <label>
          Total capacity (m³)
          <input type="number" min="0.01" step="any" value={form.totalVolumeM3} onChange={(event) => setForm({ ...form, totalVolumeM3: event.target.value })} placeholder="e.g. 100" required />
        </label>
        <button type="submit" disabled={isLoading}>{isLoading ? 'Creating zone…' : 'Create zone'}</button>
      </form>
      {message && <ApiMessage kind="success">{message}</ApiMessage>}
      {error && <ApiMessage kind="error">{error}</ApiMessage>}
    </section>
  )
}
