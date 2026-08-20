export default function LoadingSpinner({
  size = 'medium',
  label = 'Loading',
}) {
  return (
    <span className="loading-indicator" role="status" aria-live="polite">
      <span className={`spinner spinner--${size}`} aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  )
}
