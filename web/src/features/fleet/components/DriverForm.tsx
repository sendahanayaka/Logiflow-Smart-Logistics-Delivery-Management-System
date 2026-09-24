import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateDriverMutation, useUpdateDriverMutation } from '../api/fleetApi';
import { CreateDriverRequest, DriverStatus, Driver } from '../types';

interface DriverFormProps {
  initialValues?: Partial<Driver | CreateDriverRequest>;
  isEditMode?: boolean;
  driverId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const phonePattern = /^\+?[0-9][0-9\s().-]{6,30}$/;

interface FormErrors {
  fullName?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  phoneNumber?: string;
  status?: string;
  userId?: string;
}

export const DriverForm: React.FC<DriverFormProps> = ({
  initialValues,
  isEditMode = false,
  driverId,
  onCancel,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [createDriver, createResult] = useCreateDriverMutation();
  const [updateDriver, updateResult] = useUpdateDriverMutation();

  const isLoading = isEditMode ? updateResult.isLoading : createResult.isLoading;
  const isError = isEditMode ? updateResult.isError : createResult.isError;
  const error = isEditMode ? updateResult.error : createResult.error;
  const isSuccess = isEditMode ? updateResult.isSuccess : createResult.isSuccess;

  const [values, setValues] = useState<CreateDriverRequest>({
    fullName: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    phoneNumber: '',
    status: DriverStatus.Available,
    userId: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialValues) {
      const formattedDate = initialValues.licenseExpiryDate
        ? initialValues.licenseExpiryDate.split('T')[0]
        : '';
      setValues({
        fullName: initialValues.fullName || '',
        licenseNumber: initialValues.licenseNumber || '',
        licenseExpiryDate: formattedDate,
        phoneNumber: initialValues.phoneNumber || '',
        status: initialValues.status ?? DriverStatus.Available,
        userId: initialValues.userId || null,
      });
    }
  }, [initialValues]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const trimmedName = values.fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = 'Full Name is required.';
    } else if (trimmedName.length > 100) {
      newErrors.fullName = 'Full Name cannot exceed 100 characters.';
    }

    const trimmedLicense = values.licenseNumber.trim();
    if (!trimmedLicense) {
      newErrors.licenseNumber = 'License Number is required.';
    } else if (trimmedLicense.length > 50) {
      newErrors.licenseNumber = 'License Number cannot exceed 50 characters.';
    }

    if (!values.licenseExpiryDate) {
      newErrors.licenseExpiryDate = 'License Expiry Date is required.';
    } else {
      const date = new Date(values.licenseExpiryDate);
      if (isNaN(date.getTime())) {
        newErrors.licenseExpiryDate = 'Please enter a valid date.';
      }
    }

    if (values.phoneNumber && values.phoneNumber.trim()) {
      if (!phonePattern.test(values.phoneNumber.trim())) {
        newErrors.phoneNumber = 'Enter a valid phone number format.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === 'status' ? Number(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      fullName: values.fullName.trim(),
      licenseNumber: values.licenseNumber.trim(),
      licenseExpiryDate: values.licenseExpiryDate,
      phoneNumber: values.phoneNumber?.trim() || null,
      status: Number(values.status),
      userId: values.userId?.trim() || null,
    };

    try {
      if (isEditMode && driverId) {
        await updateDriver({ id: driverId, data: payload }).unwrap();
      } else {
        await createDriver(payload).unwrap();
      }

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          navigate(isEditMode && driverId ? `/drivers/${driverId}` : '/drivers');
        }, 1200);
      }
    } catch {
      // Error handled via RTK Query mutation state (isError & error)
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(isEditMode && driverId ? `/drivers/${driverId}` : '/drivers');
    }
  };

  const getErrorMessage = (): string => {
    if (!error) return isEditMode ? 'Failed to update driver.' : 'Failed to create driver.';
    if ('data' in error) {
      const data = error.data as { message?: string };
      return data?.message || 'Server error occurred.';
    }
    return 'Network or server error occurred.';
  };

  return (
    <div className="user-form-card">
      <form className="user-form" onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem', color: 'var(--color-navy)', fontWeight: 800 }}>
            {isEditMode ? 'Edit Driver Record' : 'Register New Driver'}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            {isEditMode
              ? 'Update driver name, license details, phone number, system user link, or operational status.'
              : 'Enter driver full name, license information, contact details, and initial status for fleet dispatching.'}
          </p>
        </div>

        {isSuccess && (
          <div className="auth-notice auth-notice--success" role="status">
            {isEditMode ? 'Driver details updated successfully! Redirecting...' : 'Driver registered successfully! Redirecting...'}
          </div>
        )}

        {isError && (
          <div className="error-message">
            <h3>{isEditMode ? 'Driver Update Failed' : 'Driver Registration Failed'}</h3>
            <p>{getErrorMessage()}</p>
          </div>
        )}

        {/* Section 1: License & Contact Details */}
        <div className="form-section">
          <h3 className="form-section__title">
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h2" />
                <path d="M15 12h2" />
                <path d="M7 16h10" />
              </svg>
            </span>
            Driver Personal & License Information
          </h3>
          <div className="user-form__grid">
            <div className="form-field form-field--wide">
              <label htmlFor="driver-fullname">Driver Full Name *</label>
              <input
                id="driver-fullname"
                name="fullName"
                type="text"
                value={values.fullName}
                onChange={handleChange}
                placeholder="e.g. Kamal Perera"
                maxLength={100}
                disabled={isLoading}
                aria-invalid={Boolean(errors.fullName)}
              />
              {errors.fullName && <span className="form-field__error">{errors.fullName}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="driver-license">Driver License Number *</label>
              <input
                id="driver-license"
                name="licenseNumber"
                type="text"
                value={values.licenseNumber}
                onChange={handleChange}
                placeholder="e.g. B1234567"
                maxLength={50}
                disabled={isLoading}
                aria-invalid={Boolean(errors.licenseNumber)}
              />
              {errors.licenseNumber && <span className="form-field__error">{errors.licenseNumber}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="driver-expiry">License Expiry Date *</label>
              <input
                id="driver-expiry"
                name="licenseExpiryDate"
                type="date"
                value={values.licenseExpiryDate}
                onChange={handleChange}
                disabled={isLoading}
                aria-invalid={Boolean(errors.licenseExpiryDate)}
              />
              {errors.licenseExpiryDate && (
                <span className="form-field__error">{errors.licenseExpiryDate}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="driver-phone">Phone Number</label>
              <input
                id="driver-phone"
                name="phoneNumber"
                type="tel"
                value={values.phoneNumber || ''}
                onChange={handleChange}
                placeholder="e.g. 0771234567"
                disabled={isLoading}
                aria-invalid={Boolean(errors.phoneNumber)}
              />
              {errors.phoneNumber && <span className="form-field__error">{errors.phoneNumber}</span>}
            </div>
          </div>
        </div>

        {/* Section 2: Fleet Status & System Association */}
        <div className="form-section">
          <h3 className="form-section__title">
            <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            Operational Status & Association
          </h3>
          <div className="user-form__grid">
            <div className="form-field">
              <label htmlFor="driver-status">Current Status *</label>
              <select
                id="driver-status"
                name="status"
                value={values.status}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value={DriverStatus.Available}>Available (Ready for dispatch)</option>
                <option value={DriverStatus.OffDuty}>Off Duty</option>
                <option value={DriverStatus.OnDuty}>On Duty</option>
                <option value={DriverStatus.OnDelivery}>On Delivery</option>
                <option value={DriverStatus.Suspended}>Suspended</option>
                <option value={DriverStatus.Inactive}>Inactive</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="driver-userid">System User Account ID (Optional)</label>
              <input
                id="driver-userid"
                name="userId"
                type="text"
                value={values.userId || ''}
                onChange={handleChange}
                placeholder="Optional User GUID reference"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="user-form__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={handleCancelClick}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button type="submit" className="button button--primary" disabled={isLoading}>
            {isLoading
              ? isEditMode
                ? 'Saving Changes...'
                : 'Registering Driver...'
              : isEditMode
              ? 'Save Changes'
              : 'Register Driver'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DriverForm;
