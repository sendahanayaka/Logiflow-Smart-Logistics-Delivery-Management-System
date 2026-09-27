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
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem', color: 'var(--color-navy)', fontWeight: 800 }}>
            {isEditMode ? 'Edit Vehicle Specifications' : 'Register New Vehicle'}
          </h2>
          <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            {isEditMode
              ? 'Update vehicle specifications, payload capacity, or operational status.'
              : 'Enter vehicle registration number, manufacturer, payload capacity, and initial fleet status.'}
          </p>
        </div>

        {isSuccess && (
          <div className="auth-notice auth-notice--success" role="status">
            {isEditMode ? 'Vehicle specifications updated successfully! Redirecting...' : 'Vehicle registered successfully! Redirecting...'}
          </div>
        )}

        {isError && (
          <div className="error-message">
            <h3>{isEditMode ? 'Vehicle Update Failed' : 'Vehicle Registration Failed'}</h3>
            <p>{getErrorMessage()}</p>
          </div>
        )}

        {/* Section 1: Vehicle Identification */}
        <div className="form-section">
          <h3 className="form-section__title">
            <svg style={{ display: 'inline-block', width: '1.25rem', height: '1.25rem', verticalAlign: 'sub', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            Vehicle Identification & Make
          </h3>
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
                placeholder="e.g. Delivery Van, Heavy Lorry, Cargo Container"
                disabled={isLoading}
                aria-invalid={Boolean(errors.vehicleType)}
              />
              {errors.vehicleType && <span className="form-field__error">{errors.vehicleType}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="make">Manufacturer / Make *</label>
              <input
                id="make"
                name="make"
                type="text"
                value={values.make}
                onChange={handleChange}
                placeholder="e.g. Toyota, Isuzu, Mitsubishi"
                disabled={isLoading}
                aria-invalid={Boolean(errors.make)}
              />
              {errors.make && <span className="form-field__error">{errors.make}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="model">Model Name *</label>
              <input
                id="model"
                name="model"
                type="text"
                value={values.model}
                onChange={handleChange}
                placeholder="e.g. Hiace, Forward, Canter"
                disabled={isLoading}
                aria-invalid={Boolean(errors.model)}
              />
              {errors.model && <span className="form-field__error">{errors.model}</span>}
            </div>
          </div>
        </div>

        {/* Section 2: Capacity & Operational Status */}
        <div className="form-section">
          <h3 className="form-section__title">
            <svg style={{ display: 'inline-block', width: '1.25rem', height: '1.25rem', verticalAlign: 'sub', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Specifications & Operational Status
          </h3>
          <div className="user-form__grid">
            <div className="form-field">
              <label htmlFor="capacity">Payload Capacity (kg) *</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                value={values.capacity || ''}
                onChange={handleChange}
                placeholder="e.g. 1500"
                disabled={isLoading}
                aria-invalid={Boolean(errors.capacity)}
              />
              {errors.capacity && <span className="form-field__error">{errors.capacity}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="vehicleStatus">Fleet Operational Status *</label>
              <select
                id="vehicleStatus"
                name="status"
                value={values.status}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value={VehicleStatus.Available}>Available (Ready for dispatch)</option>
                <option value={VehicleStatus.InTransit}>In Transit</option>
                <option value={VehicleStatus.InMaintenance}>In Maintenance</option>
                <option value={VehicleStatus.OutOfService}>Out of Service</option>
                <option value={VehicleStatus.Decommissioned}>Decommissioned</option>
              </select>
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
                : 'Registering Vehicle...'
              : isEditMode
              ? 'Save Changes'
              : 'Register Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
