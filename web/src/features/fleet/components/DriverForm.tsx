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
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', color: 'var(--color-navy)' }}>
            {isEditMode ? 'Edit Driver' : 'Add Driver'}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            {isEditMode
              ? 'Update driver license details, phone number, or status.'
              : 'Enter driver license details, phone number, and operational status.'}
          </p>
        </div>

        {isSuccess && (
          <div className="auth-notice auth-notice--success" role="status">
            {isEditMode ? 'Driver updated successfully! Redirecting...' : 'Driver created successfully! Redirecting...'}
          </div>
        )}

        {isError && (
          <div className="error-message">
            <h3>{isEditMode ? 'Driver Update Failed' : 'Driver Creation Failed'}</h3>
            <p>{getErrorMessage()}</p>
          </div>
        )}

        <div className="user-form__grid">
          <div className="form-field form-field--wide">
            <label htmlFor="driver-license">License Number *</label>
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

          <div className="form-field">
            <label htmlFor="driver-status">Status *</label>
            <select
              id="driver-status"
              name="status"
              value={values.status}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value={DriverStatus.Available}>Available</option>
              <option value={DriverStatus.OffDuty}>Off Duty</option>
              <option value={DriverStatus.OnDuty}>On Duty</option>
              <option value={DriverStatus.OnDelivery}>On Delivery</option>
              <option value={DriverStatus.Suspended}>Suspended</option>
              <option value={DriverStatus.Inactive}>Inactive</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="driver-userid">System User ID (Optional)</label>
            <input
              id="driver-userid"
              name="userId"
              type="text"
              value={values.userId || ''}
              onChange={handleChange}
              placeholder="Optional user GUID reference"
              disabled={isLoading}
            />
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
                ? 'Saving...'
                : 'Creating...'
              : isEditMode
              ? 'Save Changes'
              : 'Create Driver'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DriverForm;
