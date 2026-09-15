import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from '../../../shared/components/Button'
import ErrorMessage from '../../../shared/components/ErrorMessage'
import useAuth from '../../../shared/hooks/useAuth'
import { getAuthErrorMessage, useRegisterMutation } from '../authApi'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[0-9][0-9\s().-]{6,30}$/
const initialValues = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
}

function validate(values) {
  const errors = {}

  if (!values.fullName.trim()) errors.fullName = 'Full Name is required.'
  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!emailPattern.test(values.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = 'Phone Number is required.'
  } else if (!phonePattern.test(values.phoneNumber)) {
    errors.phoneNumber = 'Enter a reasonable phone number.'
  }
  if (!values.password) {
    errors.password = 'Password is required.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  } else if (!/[A-Z]/.test(values.password)) {
    errors.password = 'Password must include an uppercase letter.'
  } else if (!/[a-z]/.test(values.password)) {
    errors.password = 'Password must include a lowercase letter.'
  } else if (!/[0-9]/.test(values.password)) {
    errors.password = 'Password must include a number.'
  } else if (!/[^A-Za-z0-9]/.test(values.password)) {
    errors.password = 'Password must include a special character.'
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm Password is required.'
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords must match.'
  }

  return errors
}

export default function RegisterPage() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [register, { isLoading, error: requestError }] = useRegisterMutation()
  const { isAuthenticated, isInitializing } = useAuth()
  const navigate = useNavigate()

  if (!isInitializing && isAuthenticated) {
    return <Navigate to="/app" replace />
  }

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
      await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: values.phoneNumber.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      }).unwrap()

      setValues(initialValues)
      navigate('/login', {
        replace: true,
        state: { registrationSucceeded: true },
      })
    } catch {
      // RTK Query exposes the backend ProblemDetails response through requestError.
    }
  }

  const errorMessage = requestError
    ? getAuthErrorMessage(
        requestError,
        'Registration failed. Review your details and try again.',
      )
    : null

  const fields = [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      autoComplete: 'name',
    },
    { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      type: 'tel',
      autoComplete: 'tel',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      autoComplete: 'new-password',
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      autoComplete: 'new-password',
    },
  ]

  return (
    <main className="auth-page auth-page--register">
      <section className="auth-brand-panel" aria-label="LogiFlow">
        <div className="auth-brand-panel__content">
          <Link className="auth-home-link" to="/" aria-label="Back to LogiFlow home">
            <img src="/logo.png" alt="" />
            <span>LogiFlow</span>
          </Link>
          <span className="eyebrow eyebrow--light">Customer registration</span>
          <h1>Start with a secure LogiFlow account.</h1>
          <p>
            Public registration always creates an active Customer account. Staff
            access is managed separately by Operations Managers.
          </p>
        </div>
      </section>

      <section className="auth-form-panel" aria-labelledby="register-title">
        <div className="auth-card auth-card--wide">
          <div className="auth-card__heading">
            <span className="eyebrow">Join LogiFlow</span>
            <h2 id="register-title">Create your Customer account</h2>
            <p>Complete the details below. No role selection is required.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {errorMessage && (
              <ErrorMessage
                title="Unable to create account"
                message={errorMessage}
              />
            )}

            <div className="auth-form__grid">
              {fields.map((field) => (
                <div
                  className={`form-field ${field.name === 'fullName' ? 'form-field--wide' : ''}`}
                  key={field.name}
                >
                  <label htmlFor={`register-${field.name}`}>{field.label}</label>
                  <input
                    id={`register-${field.name}`}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    value={values[field.name]}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors[field.name])}
                    aria-describedby={
                      errors[field.name]
                        ? `register-${field.name}-error`
                        : field.name === 'password'
                          ? 'register-password-help'
                          : undefined
                    }
                    disabled={isLoading}
                  />
                  {errors[field.name] && (
                    <span
                      id={`register-${field.name}-error`}
                      className="form-field__error"
                    >
                      {errors[field.name]}
                    </span>
                  )}
                  {field.name === 'password' && !errors.password && (
                    <span id="register-password-help" className="form-field__help">
                      Use 8+ characters with uppercase, lowercase, number, and
                      special character.
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="auth-form__submit"
            >
              Create account
            </Button>

            <p className="auth-form__alternate">
              Already registered? <Link to="/login">Sign in</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
