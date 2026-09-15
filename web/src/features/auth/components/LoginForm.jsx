import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../../shared/components/Button'
import ErrorMessage from '../../../shared/components/ErrorMessage'
import useAuth from '../../../shared/hooks/useAuth'
import { getAuthErrorMessage, useLoginMutation } from '../authApi'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values) {
  const errors = {}

  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!emailPattern.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Password is required.'
  }

  return errors
}

export default function LoginForm() {
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [login, { isLoading, error: requestError }] = useLoginMutation()
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validate(values)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      const credentials = await login({
        email: values.email.trim(),
        password: values.password,
      }).unwrap()

      signIn(credentials)
      const requestedLocation = location.state?.from
      const destination = requestedLocation
        ? `${requestedLocation.pathname}${requestedLocation.search ?? ''}${requestedLocation.hash ?? ''}`
        : '/app'
      navigate(destination, { replace: true })
    } catch {
      // RTK Query exposes the backend ProblemDetails response through requestError.
    }
  }

  const errorMessage = requestError
    ? getAuthErrorMessage(requestError, 'Login failed. Please try again.')
    : null

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {location.state?.registrationSucceeded && (
        <div className="auth-notice auth-notice--success" role="status">
          Account created successfully. Sign in with your new credentials.
        </div>
      )}

      {errorMessage && (
        <ErrorMessage title="Unable to log in" message={errorMessage} />
      )}

      <div className="form-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          disabled={isLoading}
        />
        {errors.email && (
          <span id="login-email-error" className="form-field__error">
            {errors.email}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
          disabled={isLoading}
        />
        {errors.password && (
          <span id="login-password-error" className="form-field__error">
            {errors.password}
          </span>
        )}
      </div>

      <Button type="submit" isLoading={isLoading} className="auth-form__submit">
        Login
      </Button>

      <p className="auth-form__alternate">
        New to LogiFlow? <Link to="/register">Create a Customer account</Link>
      </p>
    </form>
  )
}
