import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateVehicleMutation, useUpdateVehicleMutation } from '../api/fleetApi';
import { CreateVehicleRequest, VehicleStatus, Vehicle } from '../types';

interface VehicleFormProps {
  initialValues?: Partial<Vehicle | CreateVehicleRequest>;
  isEditMode?: boolean;
  vehicleId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface FormErrors {
  registrationNumber?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  capacity?: string;
  status?: string;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({
  initialValues,
  isEditMode = false,
  vehicleId,
  onCancel,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const [createVehicle, createResult] = useCreateVehicleMutation();
  const [updateVehicle, updateResult] = useUpdateVehicleMutation();

  const isLoading = isEditMode ? updateResult.isLoading : createResult.isLoading;
  const isError = isEditMode ? updateResult.isError : createResult.isError;
  const error = isEditMode ? updateResult.error : createResult.error;
  const isSuccess = isEditMode ? updateResult.isSuccess : createResult.isSuccess;

  const [values, setValues] = useState<CreateVehicleRequest>({
    registrationNumber: '',
    vehicleType: '',
    make: '',
    model: '',
    capacity: 0,
    status: VehicleStatus.Available,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialValues) {
      setValues({
        registrationNumber: initialValues.registrationNumber || '',
        vehicleType: initialValues.vehicleType || '',
        make: initialValues.make || '',
        model: initialValues.model || '',
        capacity: initialValues.capacity ?? 0,
        status: initialValues.status ?? VehicleStatus.Available,
      });
    }
  }, [initialValues]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    const reg = values.registrationNumber.trim();
    if (!reg) {
      newErrors.registrationNumber = 'Registration Number is required.';
    } else if (reg.length > 50) {
      newErrors.registrationNumber = 'Registration Number cannot exceed 50 characters.';
    }

    if (!values.vehicleType.trim()) {
      newErrors.vehicleType = 'Vehicle Type is required.';
    }

    if (!values.make.trim()) {
      newErrors.make = 'Make is required.';
    }

    if (!values.model.trim()) {
      newErrors.model = 'Model is required.';
    }

    if (values.capacity === undefined || values.capacity === null || isNaN(values.capacity) || values.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === 'status' || name === 'capacity' ? Number(value) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      registrationNumber: values.registrationNumber.trim(),
      vehicleType: values.vehicleType.trim(),
      make: values.make.trim(),
      model: values.model.trim(),
      capacity: Number(values.capacity),
      status: Number(values.status),
    };

    try {
      if (isEditMode && vehicleId) {
        await updateVehicle({ id: vehicleId, data: payload }).unwrap();
      } else {
        await createVehicle(payload).unwrap();
      }

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          navigate(isEditMode && vehicleId ? `/vehicles/${vehicleId}` : '/vehicles');
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
      navigate(isEditMode && vehicleId ? `/vehicles/${vehicleId}` : '/vehicles');
    }
  };

  const getErrorMessage = (): string => {
    if (!error) return isEditMode ? 'Failed to update vehicle.' : 'Failed to create vehicle.';
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
            {isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            {isEditMode
              ? 'Update vehicle specifications, capacity, or operational status.'
              : 'Enter vehicle registration, make, model, capacity, and operational status.'}
          </p>
        </div>

        {isSuccess && (
          <div className="auth-notice auth-notice--success" role="status">
            {isEditMode ? 'Vehicle updated successfully! Redirecting...' : 'Vehicle created successfully! Redirecting...'}
          </div>
        )}

        {isError && (
          <div className="error-message">
            <h3>{isEditMode ? 'Vehicle Update Failed' : 'Vehicle Creation Failed'}</h3>
            <p>{getErrorMessage()}</p>
          </div>
        )}

        <div className="user-form__grid">
          <div className="form-field">
            <label htmlFor="registrationNumber">Registration Number *</label>
            <input
              id="registrationNumber"
              name="registrationNumber"
              type="text"
              value={values.registrationNumber}
              onChange={handleChange}
              placeholder="e.g. WP-ABC-1234"
              maxLength={50}
              disabled={isLoading}
              aria-invalid={Boolean(errors.registrationNumber)}
            />
            {errors.registrationNumber && <span className="form-field__error">{errors.registrationNumber}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="vehicleType">Vehicle Type *</label>
            <input
              id="vehicleType"
              name="vehicleType"
              type="text"
              value={values.vehicleType}
              onChange={handleChange}
              placeholder="e.g. Van, Lorry, Container"
              disabled={isLoading}
              aria-invalid={Boolean(errors.vehicleType)}
            />
            {errors.vehicleType && <span className="form-field__error">{errors.vehicleType}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="make">Make *</label>
            <input
              id="make"
              name="make"
              type="text"
              value={values.make}
              onChange={handleChange}
              placeholder="e.g. Toyota, Isuzu"
              disabled={isLoading}
              aria-invalid={Boolean(errors.make)}
            />
            {errors.make && <span className="form-field__error">{errors.make}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="model">Model *</label>
            <input
              id="model"
              name="model"
              type="text"
              value={values.model}
              onChange={handleChange}
              placeholder="e.g. Hiace, Elf"
              disabled={isLoading}
              aria-invalid={Boolean(errors.model)}
            />
            {errors.model && <span className="form-field__error">{errors.model}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="capacity">Capacity (kg) *</label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              value={values.capacity || ''}
              onChange={handleChange}
              placeholder="e.g. 1000"
              disabled={isLoading}
              aria-invalid={Boolean(errors.capacity)}
            />
            {errors.capacity && <span className="form-field__error">{errors.capacity}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="vehicleStatus">Vehicle Status *</label>
            <select
              id="vehicleStatus"
              name="status"
              value={values.status}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value={VehicleStatus.Available}>Available</option>
              <option value={VehicleStatus.InTransit}>In Transit</option>
              <option value={VehicleStatus.InMaintenance}>In Maintenance</option>
              <option value={VehicleStatus.OutOfService}>Out Of Service</option>
              <option value={VehicleStatus.Decommissioned}>Decommissioned</option>
            </select>
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
              : 'Save Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
