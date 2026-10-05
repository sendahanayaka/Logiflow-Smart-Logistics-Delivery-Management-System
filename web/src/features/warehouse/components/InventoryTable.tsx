import type { StorageZone, WarehousePackage } from '../warehouseApi'

interface InventoryTableProps {
  packages: WarehousePackage[]
  zones: StorageZone[]
  availabilityPendingId?: string
  onMakeAvailable: (packageId: string) => void
  onEdit: (pkg: WarehousePackage) => void
}

const EDITABLE_STATUSES = new Set(['Received', 'Available'])

export function InventoryTable({ packages, zones, availabilityPendingId, onMakeAvailable, onEdit }: InventoryTableProps) {
  const zonesById = new Map(zones.map((zone) => [zone.id, zone]))

  return (
    <table>
      <thead>
        <tr>
          <th>Tracking code</th><th>Order ID</th><th>Zone</th><th>Weight</th><th>Volume</th>
          <th>Fragile</th><th>Status</th><th>Received</th><th>Action</th>
        </tr>
      </thead>
      <tbody>
        {packages.map((item) => (
          <tr key={item.id}>
            <td>{item.trackingCode}</td>
            <td>{item.orderId}</td>
            <td>{zonesById.get(item.storageZoneId)?.code ?? item.storageZoneId}</td>
            <td>{item.weightKg} kg</td>
            <td>{item.volumeM3} m³</td>
            <td>{item.isFragile ? 'Yes' : 'No'}</td>
            <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
            <td>{new Date(item.receivedAt).toLocaleString()}</td>
            <td>
              <div className="row-actions">
                {item.status === 'Received' && (
                  <button
                    type="button"
                    onClick={() => onMakeAvailable(item.id)}
                    disabled={availabilityPendingId === item.id}
                  >
                    {availabilityPendingId === item.id ? 'Updating…' : 'Make available'}
                  </button>
                )}
                {EDITABLE_STATUSES.has(item.status) && (
                  <button type="button" className="secondary" onClick={() => onEdit(item)}>Edit</button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
