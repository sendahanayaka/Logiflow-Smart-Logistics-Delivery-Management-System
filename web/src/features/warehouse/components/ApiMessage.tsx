import type { ReactNode } from 'react'

interface ApiMessageProps {
  children: ReactNode
  kind?: 'error' | 'success' | 'info'
}

export function ApiMessage({ children, kind = 'info' }: ApiMessageProps) {
  const colors = {
    error: '#991b1b',
    success: '#166534',
    info: '#1d4ed8',
  }
  return <p role={kind === 'error' ? 'alert' : 'status'} style={{ color: colors[kind] }}>{children}</p>
}

export function userFacingApiError(error: unknown, fallback = 'The request could not be completed. Please try again.') {
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: number }).status
    : undefined
  if (status === 400) return 'Please correct the highlighted values and try again.'
  if (status === 404) return 'The requested warehouse resource could not be found.'
  if (status === 409) return 'Warehouse conflict: this may be a duplicate tracking code, a capacity conflict, or a concurrent update. Refresh and try again.'
  if (typeof status === 'number' && status >= 500) return 'The warehouse service is temporarily unavailable. Please try again later.'
  return fallback
}
