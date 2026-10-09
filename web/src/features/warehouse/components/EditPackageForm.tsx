import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'

import { useUpdatePackageMutation, type StorageZone, type WarehousePackage } from '../warehouseApi'
import { ApiMessage, userFacingApiError } from './ApiMessage'

interface EditPackageFormProps {
  pkg: WarehousePackage
  zones: StorageZone[]
  onClose: () => void
}

export function EditPackageForm({ pkg, zones, onClose }: EditPackageFormProps) {
  const [updatePackage, { isLoading }] = useUpdatePackageMutation()
  const [form, setForm] = useState({
    storageZoneId: pkg.storageZoneId,
    weightKg: String(pkg.weightKg),
    volumeM3: String(pkg.volumeM3),
    isFragile: pkg.isFragile,
    specialHandling: pkg.specialHandling ?? '',
  })
  const [error, setError] = useState<string>()

  // Keep the dialog stable: lock background scroll while it is open, and close on
  // Escape. Rendering through a portal (below) keeps its fixed positioning from
  // being affected by any transformed/overflow ancestor in the page layout.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)

    const weightKg = Number(form.weightKg)
    const volumeM3 = Number(form.volumeM3)
    if (!form.storageZoneId) {
      setError('A storage zone is required.')
      return
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(volumeM3) || volumeM3 <= 0) {
      setError('Weight and volume must both be greater than zero.')
      return
    }

    try {
      await updatePackage({
        packageId: pkg.id,
        body: {
          storageZoneId: form.storageZoneId,
          weightKg,
          volumeM3,
          isFragile: form.isFragile,
          specialHandling: form.specialHandling.trim() || null,
        },
      }).unwrap()
      onClose()
    } catch (requestError) {
      setError(userFacingApiError(requestError, 'The package could not be updated. Please try again.'))
    }
  }

  return createPortal(
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-package-heading"
      onClick={(event) => { if (event.target === event.currentTarget && !isLoading) onClose() }}
    >
      <section className="create-warehouse-card modal-card" onClick={(event) => event.stopPropagation()}>
        <div>
          <p className="eyebrow">Edit package</p>
          <h2 id="edit-package-heading">{pkg.trackingCode}</h2>
          <p>Only received or available packages can be edited.</p>
        </div>
        <form className="warehouse-form" onSubmit={submit} noValidate>
          <label>
            Storage zone
            <select value={form.storageZoneId} onChange={(event) => setForm({ ...form, storageZoneId: event.target.value })} required>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.code} — {zone.name}</option>
              ))}
            </select>
          </label>
          <label>
            Weight (kg)
            <input type="number" min="0.01" step="any" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} required />
          </label>
          <label>
            Volume (m³)
            <input type="number" min="0.01" step="any" value={form.volumeM3} onChange={(event) => setForm({ ...form, volumeM3: event.target.value })} required />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={form.isFragile} onChange={(event) => setForm({ ...form, isFragile: event.target.checked })} />
            Fragile
          </label>
          <label>
            Special handling
            <input value={form.specialHandling} onChange={(event) => setForm({ ...form, specialHandling: event.target.value })} placeholder="Optional instructions" />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={isLoading}>{isLoading ? 'Saving…' : 'Save changes'}</button>
            <button type="button" className="secondary" onClick={onClose} disabled={isLoading}>Cancel</button>
          </div>
        </form>
        {error && <ApiMessage kind="error">{error}</ApiMessage>}
      </section>
    </div>,
    document.body,
  )
}
