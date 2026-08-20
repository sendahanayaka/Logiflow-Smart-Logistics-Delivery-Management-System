import { useState } from 'react'
import Button from '../../../shared/components/Button'
import ErrorMessage from '../../../shared/components/ErrorMessage'
import RoleSelector from './RoleSelector'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[0-9][0-9\s().-]{6,30}$/

function validate(values, isCreate) {
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
  if (isCreate && !values.password) errors.password = 'Password is required.'
  if (isCreate && !values.role) errors.role = 'Role is required.'

  return errors
}

export default function UserForm({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}) {
  const isCreate = !user
  const [values, setValues] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    password: '',
    role: user?.role ?? 'Customer',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = validate(values, isCreate)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload = {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phoneNumber: values.phoneNumber.trim(),
    }

    if (isCreate) {
      payload.password = values.password
      payload.role = values.role
    }

    onSubmit(payload)
  }

  return (
    <form className="user-form" onSubmit={handleSubmit} noValidate>
      {error && <ErrorMessage title="Unable to save user" message={error} />}

      <div className="user-form__grid">
        <div className="form-field form-field--wide">
          <label htmlFor="user-full-name">Full Name</label>
          <input
            id="user-full-name"
            name="fullName"
            value={values.fullName}
            onChange={handleChange}
            autoComplete="name"
            disabled={isLoading}
            aria-invalid={Boolean(errors.fullName)}
          />
          {errors.fullName && (
            <span className="form-field__error">{errors.fullName}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="user-email">Email</label>
          <input
            id="user-email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            autoComplete="email"
            disabled={isLoading}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <span className="form-field__error">{errors.email}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="user-phone">Phone Number</label>
          <input
            id="user-phone"
            name="phoneNumber"
            type="tel"
            value={values.phoneNumber}
            onChange={handleChange}
            autoComplete="tel"
            disabled={isLoading}
            aria-invalid={Boolean(errors.phoneNumber)}
          />
          {errors.phoneNumber && (
            <span className="form-field__error">{errors.phoneNumber}</span>
          )}
        </div>

        {isCreate && (
          <>
            <div className="form-field">
              <label htmlFor="user-password">Password</label>
              <input
                id="user-password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password && (
                <span className="form-field__error">{errors.password}</span>
              )}
            </div>
            <RoleSelector
              value={values.role}
              onChange={(role) => {
                setValues((current) => ({ ...current, role }))
                setErrors((current) => ({ ...current, role: undefined }))
              }}
              required
              disabled={isLoading}
            />
          </>
        )}
      </div>

      {!isCreate && (
        <p className="user-form__note">
          Role and status are managed through their dedicated account actions.
          Existing passwords are never displayed.
        </p>
      )}

      <div className="user-form__actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isCreate ? 'Create user' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
