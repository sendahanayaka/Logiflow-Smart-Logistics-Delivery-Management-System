import { useState, type FormEvent } from 'react'

import { useReceivePackageMutation, type StorageZone } from '../warehouseApi'
import { ApiMessage, userFacingApiError } from './ApiMessage'

interface PackageIntakeFormProps {
  warehouseId: string
  zones: StorageZone[]
}

export function PackageIntakeForm({ warehouseId, zones }: PackageIntakeFormProps) {
  const [receivePackage, { isLoading }] = useReceivePackageMutation()
  const [form, setForm] = useState({
    orderId: '', storageZoneId: '', trackingCode: '', weightKg: '', volumeM3: '', isFragile: false, specialHandling: '',
  })
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(undefined)
    setError(undefined)
    const weightKg = Number(form.weightKg)
    const volumeM3 = Number(form.volumeM3)
    if (!form.orderId.trim() || !form.storageZoneId || !form.trackingCode.trim() || weightKg <= 0 || volumeM3 <= 0) {
      setError('Order, storage zone, tracking code, and positive weight and volume are required.')
      return
    }
    try {
      await receivePackage({
        orderId: form.orderId.trim(), warehouseId, storageZoneId: form.storageZoneId,
        trackingCode: form.trackingCode.trim(), weightKg, volumeM3, isFragile: form.isFragile,
        specialHandling: form.specialHandling.trim() || null,
      }).unwrap()
      setMessage('Package received successfully.')
      setForm({ orderId: '', storageZoneId: '', trackingCode: '', weightKg: '', volumeM3: '', isFragile: false, specialHandling: '' })
    } catch (requestError) {
      setError(userFacingApiError(requestError))
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <label>Order ID<input value={form.orderId} onChange={(event) => setForm({ ...form, orderId: event.target.value })} required /></label>
      <label>Storage zone
        <select value={form.storageZoneId} onChange={(event) => setForm({ ...form, storageZoneId: event.target.value })} required>
          <option value="">Select a zone</option>
          {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.code} — {zone.name}</option>)}
        </select>
      </label>
      <label>Tracking code<input value={form.trackingCode} onChange={(event) => setForm({ ...form, trackingCode: event.target.value })} required /></label>
      <label>Weight (kg)<input type="number" min="0.01" step="any" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} required /></label>
      <label>Volume (m³)<input type="number" min="0.01" step="any" value={form.volumeM3} onChange={(event) => setForm({ ...form, volumeM3: event.target.value })} required /></label>
      <label><input type="checkbox" checked={form.isFragile} onChange={(event) => setForm({ ...form, isFragile: event.target.checked })} /> Fragile package</label>
      <label>Special handling<textarea value={form.specialHandling} onChange={(event) => setForm({ ...form, specialHandling: event.target.value })} /></label>
      <button type="submit" disabled={isLoading}>{isLoading ? 'Receiving…' : 'Receive package'}</button>
      {message && <ApiMessage kind="success">{message}</ApiMessage>}
      {error && <ApiMessage kind="error">{error}</ApiMessage>}
    </form>
  )
}
