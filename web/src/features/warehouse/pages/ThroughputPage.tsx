import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { ThroughputReport } from '../components/ThroughputReport'
import { useGetWarehouseThroughputQuery } from '../warehouseApi'
import '../../portals/Portal.css'

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
    <div className="portal-container">
      <Link className="btn-primary-outline" to={`/warehouse/${warehouseId}`} style={{ display: 'inline-block', marginBottom: '2rem' }}>← Back to warehouse</Link>

      <header className="portal-header fade-in-up">
        <span className="portal-role-badge">OPERATIONAL REPORTING</span>
        <h1>Warehouse Throughput</h1>
        <div className="portal-divider"></div>
        <p>Review received, reserved, dispatched, and batched activity for a selected period.</p>
      </header>

      <div className="create-warehouse-card fade-in-up" style={{ marginTop: 0 }}>
        <form className="warehouse-form" onSubmit={submit}>
          <label>From <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} required /></label>
          <label>To <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} required /></label>
          <button type="submit">Load report</button>
        </form>
        {validationError && <ApiMessage kind="error">{validationError}</ApiMessage>}
        {report.isLoading && <div className="loading-state"><span className="spinner"></span><p>Loading throughput report…</p></div>}
        {report.error && <ApiMessage kind="error">{userFacingApiError(report.error, 'The throughput report could not be loaded.')}</ApiMessage>}
        {report.data && <ThroughputReport report={report.data} />}
      </div>
    </div>
  )
}
