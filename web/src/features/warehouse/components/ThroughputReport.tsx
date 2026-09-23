import type { WarehouseThroughput } from '../warehouseApi'

export function ThroughputReport({ report }: { report: WarehouseThroughput }) {
  const metrics: Array<[string, number, string]> = [
    ['Received packages', report.receivedPackageCount, ''],
    ['Received weight', report.receivedWeightKg, ' kg'],
    ['Received volume', report.receivedVolumeM3, ' m³'],
    ['Reserved packages', report.reservedPackageCount, ''],
    ['Dispatched packages', report.dispatchedPackageCount, ''],
    ['Created dispatch batches', report.createdDispatchBatchCount, ''],
    ['Batched packages', report.batchedPackageCount, ''],
  ]
  return (
    <dl>
      {metrics.map(([label, value, unit]) => <div key={label}><dt>{label}</dt><dd>{value.toLocaleString()}{unit}</dd></div>)}
    </dl>
  )
}
