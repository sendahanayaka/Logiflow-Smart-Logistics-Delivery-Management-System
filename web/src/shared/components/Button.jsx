import LoadingSpinner from './LoadingSpinner'

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`button button--${variant} button--${size} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="small" label="" />}
      <span>{children}</span>
    </button>
  )
}
