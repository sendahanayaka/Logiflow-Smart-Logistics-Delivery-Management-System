// [S3] Presentation only: the backend remains the authority for safety decisions.
interface CapacityIndicatorProps {
  label: string
  occupied: number
  total: number
  unit: string
}

export function CapacityIndicator({ label, occupied, total, unit }: CapacityIndicatorProps) {
  const remaining = Math.max(total - occupied, 0)
  const percentage = total > 0 ? Math.min((occupied / total) * 100, 100) : 0

  return (
    <section aria-label={`${label} capacity`}>
      <strong>{label}</strong>
      <div>{occupied.toLocaleString()} / {total.toLocaleString()} {unit}</div>
      <div aria-hidden="true" style={{ background: '#e5e7eb', height: 10, margin: '6px 0', width: '100%' }}>
        <div style={{ background: '#2563eb', height: '100%', width: `${percentage}%` }} />
      </div>
      <small>{remaining.toLocaleString()} {unit} remaining ({percentage.toFixed(1)}% occupied)</small>
    </section>
  )
}
