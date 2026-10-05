import type { DispatchBatch } from '../warehouseApi'

export function DispatchBatchTable({ batch }: { batch: DispatchBatch }) {
  return (
    <table>
      <caption>Dispatch batch {batch.id}</caption>
      <thead><tr><th>Vehicle</th><th>Status</th><th>Total weight</th><th>Total volume</th></tr></thead>
      <tbody><tr><td>{batch.vehicleId}</td><td>{batch.status}</td><td>{batch.totalWeightKg} kg</td><td>{batch.totalVolumeM3} m³</td></tr></tbody>
    </table>
  )
}
