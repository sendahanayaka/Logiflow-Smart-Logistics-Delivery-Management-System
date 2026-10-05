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
    <section className="capacity-indicator" aria-label={`${label} capacity`}>
      <strong>{label}</strong>
      <div className="capacity-values">{occupied.toLocaleString()} / {total.toLocaleString()} {unit}</div>
      <div className="capacity-track" aria-hidden="true">
        <div className="capacity-bar" style={{ width: `${percentage}%` }} />
      </div>
      <small>{remaining.toLocaleString()} {unit} remaining ({percentage.toFixed(1)}% occupied)</small>
    </section>
  )
}
