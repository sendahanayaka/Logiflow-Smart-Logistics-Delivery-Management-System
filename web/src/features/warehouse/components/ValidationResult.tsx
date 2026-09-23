import { useGetDispatchBatchValidationQuery } from '../warehouseApi'
import { ApiMessage, userFacingApiError } from './ApiMessage'

export function ValidationResult({ batchId }: { batchId: string }) {
  const { data, error, isLoading } = useGetDispatchBatchValidationQuery(batchId)
  if (isLoading) return <ApiMessage>Loading backend validation…</ApiMessage>
  if (error) return <ApiMessage kind="error">{userFacingApiError(error, 'Batch validation could not be loaded.')}</ApiMessage>
  if (!data) return null

  const rules = [
    ['Weight capacity', data.weightCapacityValid],
    ['Volume capacity', data.volumeCapacityValid],
    ['Reserved package state', data.packageAvailabilityValid],
    ['Warehouse consistency', data.warehouseConsistent],
    ['Fragile/load-sequence compatibility', data.fragileLoadOrderValid],
  ]
  const kind = data.result === 'PASS' ? 'success' : 'error'
  return (
    <section aria-label="Dispatch batch validation">
      <h2>Backend validation: {data.result}</h2>
      <ApiMessage kind={kind}>{data.result === 'PASS' ? 'The backend approved this dispatch batch.' : 'The backend did not approve this dispatch batch.'}</ApiMessage>
      <ul>{rules.map(([label, passed]) => <li key={String(label)}>{label}: {passed ? 'Pass' : 'Fail'}</li>)}</ul>
      {data.issues.length > 0 && <ul>{data.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
    </section>
  )
}
