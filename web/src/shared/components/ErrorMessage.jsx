export default function ErrorMessage({
  title = 'Something went wrong',
  message,
  action,
}) {
  return (
    <section className="error-message" role="alert">
      <span className="error-message__mark" aria-hidden="true">
        !
      </span>
      <div>
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        {action && <div className="error-message__action">{action}</div>}
      </div>
    </section>
  )
}
