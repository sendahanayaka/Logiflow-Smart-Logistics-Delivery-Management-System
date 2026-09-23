import type { StorageZone, WarehousePackage } from '../warehouseApi'

interface InventoryTableProps {
  packages: WarehousePackage[]
  zones: StorageZone[]
  availabilityPendingId?: string
  onMakeAvailable: (packageId: string) => void
}

export function InventoryTable({ packages, zones, availabilityPendingId, onMakeAvailable }: InventoryTableProps) {
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
            <td>{item.status}</td>
            <td>{new Date(item.receivedAt).toLocaleString()}</td>
            <td>
              {item.status === 'Received' && (
                <button
                  type="button"
                  onClick={() => onMakeAvailable(item.id)}
                  disabled={availabilityPendingId === item.id}
                >
                  {availabilityPendingId === item.id ? 'Updating…' : 'Make available'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
