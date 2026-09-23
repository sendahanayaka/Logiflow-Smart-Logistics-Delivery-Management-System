import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { ThroughputReport } from '../components/ThroughputReport'
import { useGetWarehouseThroughputQuery } from '../warehouseApi'

const today = new Date().toISOString().slice(0, 10)
const startOfMonth = `${today.slice(0, 8)}01`

export function ThroughputPage() {
  const { warehouseId } = useParams()
  const [fromDate, setFromDate] = useState(startOfMonth)
  const [toDate, setToDate] = useState(today)
  const [submittedRange, setSubmittedRange] = useState<{ fromUtc: string; toUtc: string }>()
  const [validationError, setValidationError] = useState<string>()
  const report = useGetWarehouseThroughputQuery({
    warehouseId: warehouseId ?? '',
    fromUtc: submittedRange?.fromUtc ?? '',
    toUtc: submittedRange?.toUtc ?? '',
  }, { skip: !warehouseId || !submittedRange })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!fromDate || !toDate || fromDate > toDate) {
      setValidationError('Choose a valid date range where the start date is not after the end date.')
      return
    }
    setValidationError(undefined)
    setSubmittedRange({ fromUtc: `${fromDate}T00:00:00.000Z`, toUtc: `${toDate}T23:59:59.999Z` })
  }

  if (!warehouseId) return <ApiMessage kind="error">A warehouse identifier is required.</ApiMessage>
  return (
    <section>
      <h1>Warehouse throughput</h1>
      <p><Link to={`/warehouse/${warehouseId}`}>Back to warehouse</Link></p>
      <form onSubmit={submit}>
        <label>From <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} required /></label>
        <label>To <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} required /></label>
        <button type="submit">Load report</button>
      </form>
      {validationError && <ApiMessage kind="error">{validationError}</ApiMessage>}
      {report.isLoading && <ApiMessage>Loading throughput report…</ApiMessage>}
      {report.error && <ApiMessage kind="error">{userFacingApiError(report.error, 'The throughput report could not be loaded.')}</ApiMessage>}
      {report.data && <ThroughputReport report={report.data} />}
    </section>
  )
}
