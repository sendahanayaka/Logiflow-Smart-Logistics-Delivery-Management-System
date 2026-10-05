import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { AgentValidationPanel } from '../components/AgentValidationPanel'
import { DispatchBatchBuilder } from '../components/DispatchBatchBuilder'
import { ValidationResult } from '../components/ValidationResult'
import { useGetPackagesQuery, useGetStorageZonesQuery } from '../warehouseApi'
import { useTriggerWorkflowFromBatchMutation } from '../../delivery/deliveryApi'
import '../../portals/Portal.css'

function DispatchToOps({ batchId }: { batchId: string }) {
  const [trigger, { isLoading }] = useTriggerWorkflowFromBatchMutation()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const send = async () => {
    setMsg(null)
    try {
      const wf = await trigger({ batchId }).unwrap()
      setMsg({ ok: true, text: `Route planned and queued for ops approval (${wf.workflowKey}, ${wf.stopCount} stops).` })
    } catch (e: any) {
      setMsg({ ok: false, text: userFacingApiError(e, 'Could not plan the route for this batch.') })
    }
  }

  return (
    <div className="dispatch-to-ops" style={{ marginTop: '1rem' }}>
      <button className="btn-primary" onClick={send} disabled={isLoading}>
        {isLoading ? 'Planning route…' : 'Plan route & send to ops'}
      </button>
      {msg && <ApiMessage kind={msg.ok ? 'success' : 'error'}>{msg.text}</ApiMessage>}
    </div>
  )
}

export function DispatchPage() {
  const { warehouseId } = useParams()
  const [batchId, setBatchId] = useState<string>()
  const skip = !warehouseId
  const availablePackages = useGetPackagesQuery(
    { warehouseId: warehouseId ?? '', page: 1, pageSize: 100, status: 'Available' },
    { skip },
  )
  const zones = useGetStorageZonesQuery(warehouseId ?? '', { skip })

  if (skip) return <ApiMessage kind="error">A warehouse identifier is required.</ApiMessage>
  if (availablePackages.isLoading || zones.isLoading) return <ApiMessage>Loading available packages…</ApiMessage>
  if (availablePackages.error || zones.error) return <ApiMessage kind="error">{userFacingApiError(availablePackages.error ?? zones.error, 'Dispatch prerequisites could not be loaded.')}</ApiMessage>
  return (
    <div className="portal-container">
      <Link className="btn-primary-outline" to={`/warehouse/${warehouseId}`} style={{ display: 'inline-block', marginBottom: '2rem' }}>← Back to warehouse</Link>

      <header className="portal-header fade-in-up">
        <span className="portal-role-badge">OUTBOUND OPERATIONS</span>
        <h1>Dispatch Batch Builder</h1>
        <div className="portal-divider"></div>
        <p>Choose available packages, plan a deterministic load sequence, and verify every safety rule.</p>
      </header>

      <div className="create-warehouse-card fade-in-up" style={{ marginTop: 0 }}>
        <DispatchBatchBuilder warehouseId={warehouseId} packages={availablePackages.data?.items ?? []} zones={zones.data ?? []} onBatchCreated={setBatchId} />
        {batchId && <ValidationResult batchId={batchId} />}
        {batchId && <AgentValidationPanel batchId={batchId} />}
        {batchId && <DispatchToOps batchId={batchId} />}
      </div>
    </div>
  )
}
