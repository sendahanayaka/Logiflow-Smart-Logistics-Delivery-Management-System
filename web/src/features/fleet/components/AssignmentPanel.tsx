import React, { useState } from 'react';
import {
  useGetDriversQuery,
  useGetVehiclesQuery,
  useAssignDriverMutation,
  useEndAssignmentMutation,
  useGetActiveAssignmentsQuery,
  useGetAssignmentHistoryQuery,
} from '../api/fleetApi';
import { DriverStatus, VehicleStatus, AssignmentResponse } from '../types';
import { formatDate } from './DriverTable';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface FormErrors {
  driverId?: string;
  vehicleId?: string;
  notes?: string;
}

export const AssignmentPanel: React.FC = () => {
  const { data: drivers = [], isLoading: isLoadingDrivers } = useGetDriversQuery();
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useGetVehiclesQuery();
  const { data: activeAssignments = [], isLoading: isLoadingActive, isError: isErrorActive, refetch: refetchActive } =
    useGetActiveAssignmentsQuery();
  const { data: historyAssignments = [], isLoading: isLoadingHistory, isError: isErrorHistory, refetch: refetchHistory } =
    useGetAssignmentHistoryQuery();

  const [assignDriver, { isLoading: isAssigning, isError: isAssignError, error: assignError, isSuccess: isAssignSuccess }] =
    useAssignDriverMutation();
  const [endAssignment, { isLoading: isEnding }] = useEndAssignmentMutation();

  // Form State
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // End Assignment Modal State
  const [assignmentToEnd, setAssignmentToEnd] = useState<AssignmentResponse | null>(null);

  // Active Tab State for tables
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Filter available drivers & vehicles
  const availableDrivers = drivers.filter((d) => d.status === DriverStatus.Available);
  const availableVehicles = vehicles.filter((v) => v.status === VehicleStatus.Available);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!driverId) {
      newErrors.driverId = 'Please select a driver.';
    }

    if (!vehicleId) {
      newErrors.vehicleId = 'Please select a vehicle.';
    }

    if (notes && notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await assignDriver({
        driverId,
        vehicleId,
        notes: notes.trim() || null,
      }).unwrap();

      setDriverId('');
      setVehicleId('');
      setNotes('');
      setErrors({});
    } catch {
      // Handled via RTK Query mutation state (isAssignError & assignError)
    }
  };

  const handleConfirmEndAssignment = async () => {
    if (!assignmentToEnd) return;
    try {
      await endAssignment({ id: assignmentToEnd.id }).unwrap();
      setAssignmentToEnd(null);
    } catch {
      // Handled via mutation
    }
  };

  const getAssignErrorMessage = (): string => {
    if (!assignError) return 'Failed to create assignment.';
    if ('data' in assignError) {
      const data = assignError.data as { message?: string };
      return data?.message || 'Conflict or server error assigning driver.';
    }
    return 'Network or server error creating assignment.';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Assignment Form Card */}
      <div className="user-form-card">
        <form className="user-form" onSubmit={handleAssignSubmit} noValidate>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', color: 'var(--color-navy)' }}>
              Assign Vehicle & Driver
            </h2>
            <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.875rem' }}>
              Select an available driver and an available vehicle to create an active assignment.
            </p>
          </div>

          {isAssignSuccess && (
            <div className="auth-notice auth-notice--success" role="status">
              Driver and vehicle assigned successfully! Both statuses updated.
            </div>
          )}

          {isAssignError && (
            <div className="error-message">
              <h3>Assignment Failed</h3>
              <p>{getAssignErrorMessage()}</p>
            </div>
          )}

          <div style={{ fontSize: '0.825rem', color: 'var(--color-muted)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            Only available drivers and vehicles can be assigned.
          </div>

          <div className="user-form__grid">
            {/* Driver Selector */}
            <div className="form-field">
              <label htmlFor="assign-driver">Available Driver *</label>
              <select
                id="assign-driver"
                value={driverId}
                onChange={(e) => {
                  setDriverId(e.target.value);
                  setErrors((prev) => ({ ...prev, driverId: undefined }));
                }}
                disabled={isAssigning || isLoadingDrivers || availableDrivers.length === 0}
                aria-invalid={Boolean(errors.driverId)}
              >
                <option value="">
                  {isLoadingDrivers
                    ? 'Loading drivers...'
                    : availableDrivers.length === 0
                    ? '-- No available drivers --'
                    : '-- Select Available Driver --'}
                </option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    License: {d.licenseNumber} {d.phoneNumber ? `(${d.phoneNumber})` : ''}
                  </option>
                ))}
              </select>
              {availableDrivers.length === 0 && !isLoadingDrivers && (
                <span className="form-field__error" style={{ color: 'var(--color-warning)' }}>
                  No available drivers.
                </span>
              )}
              {errors.driverId && <span className="form-field__error">{errors.driverId}</span>}
            </div>

            {/* Vehicle Selector */}
            <div className="form-field">
              <label htmlFor="assign-vehicle">Available Vehicle *</label>
              <select
                id="assign-vehicle"
                value={vehicleId}
                onChange={(e) => {
                  setVehicleId(e.target.value);
                  setErrors((prev) => ({ ...prev, vehicleId: undefined }));
                }}
                disabled={isAssigning || isLoadingVehicles || availableVehicles.length === 0}
                aria-invalid={Boolean(errors.vehicleId)}
              >
                <option value="">
                  {isLoadingVehicles
                    ? 'Loading vehicles...'
                    : availableVehicles.length === 0
                    ? '-- No available vehicles --'
                    : '-- Select Available Vehicle --'}
                </option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    Reg: {v.registrationNumber} ({v.make} {v.model} - {v.capacity}kg)
                  </option>
                ))}
              </select>
              {availableVehicles.length === 0 && !isLoadingVehicles && (
                <span className="form-field__error" style={{ color: 'var(--color-warning)' }}>
                  No available vehicles.
                </span>
              )}
              {errors.vehicleId && <span className="form-field__error">{errors.vehicleId}</span>}
            </div>

            {/* Notes Field */}
            <div className="form-field form-field--wide">
              <label htmlFor="assign-notes">Assignment Notes (Optional)</label>
              <input
                id="assign-notes"
                type="text"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setErrors((prev) => ({ ...prev, notes: undefined }));
                }}
                placeholder="e.g. Route details, dispatch batch ID, or shift instructions"
                maxLength={500}
                disabled={isAssigning}
                aria-invalid={Boolean(errors.notes)}
              />
              {errors.notes && <span className="form-field__error">{errors.notes}</span>}
            </div>
          </div>

          <div className="user-form__actions">
            <button
              type="submit"
              className="button button--primary"
              disabled={isAssigning || availableDrivers.length === 0 || availableVehicles.length === 0}
            >
              {isAssigning ? 'Assigning...' : 'Assign Vehicle'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Assignments Section Tabs (Active / History) */}
      <div>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', borderBottom: '2px solid var(--color-border)', paddingBottom: '0.5rem' }}>
          <button
            type="button"
            className={`button ${activeTab === 'active' ? 'button--primary' : 'button--secondary'}`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => setActiveTab('active')}
          >
            Active Assignments ({activeAssignments.length})
          </button>
          <button
            type="button"
            className={`button ${activeTab === 'history' ? 'button--primary' : 'button--secondary'}`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => setActiveTab('history')}
          >
            Assignment History ({historyAssignments.length})
          </button>
        </div>

        {/* Tab 1: Active Assignments */}
        {activeTab === 'active' && (
          <div>
            {isLoadingActive && (
              <div className="details-card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                Loading active assignments...
              </div>
            )}

            {isErrorActive && (
              <div className="error-message">
                <h3>Failed to Load Active Assignments</h3>
                <button type="button" className="button button--danger" style={{ marginTop: '0.5rem' }} onClick={() => refetchActive()}>
                  Retry
                </button>
              </div>
            )}

            {!isLoadingActive && !isErrorActive && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Driver License</th>
                      <th>Vehicle Registration</th>
                      <th>Assigned At</th>
                      <th>Notes</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                          No active assignments found. Select an available driver and vehicle above to create one.
                        </td>
                      </tr>
                    ) : (
                      activeAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td>
                            <strong>{assignment.driverLicenseNumber}</strong>
                          </td>
                          <td>
                            <strong>{assignment.vehicleRegistrationNumber}</strong>
                          </td>
                          <td>{formatDate(assignment.assignedAt)}</td>
                          <td>{assignment.notes || 'N/A'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="button button--danger"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                              onClick={() => setAssignmentToEnd(assignment)}
                            >
                              End Assignment
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Assignment History */}
        {activeTab === 'history' && (
          <div>
            {isLoadingHistory && (
              <div className="details-card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '2rem' }}>
                Loading assignment history...
              </div>
            )}

            {isErrorHistory && (
              <div className="error-message">
                <h3>Failed to Load Assignment History</h3>
                <button type="button" className="button button--danger" style={{ marginTop: '0.5rem' }} onClick={() => refetchHistory()}>
                  Retry
                </button>
              </div>
            )}

            {!isLoadingHistory && !isErrorHistory && (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Driver License</th>
                      <th>Vehicle Registration</th>
                      <th>Assigned At</th>
                      <th>Unassigned At</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyAssignments.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                          No assignment history recorded.
                        </td>
                      </tr>
                    ) : (
                      historyAssignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td>
                            <strong>{assignment.driverLicenseNumber}</strong>
                          </td>
                          <td>
                            <strong>{assignment.vehicleRegistrationNumber}</strong>
                          </td>
                          <td>{formatDate(assignment.assignedAt)}</td>
                          <td>{assignment.unassignedAt ? formatDate(assignment.unassignedAt) : '—'}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                assignment.isActive ? 'status-badge--available' : 'status-badge--inactive'
                              }`}
                            >
                              <span className="status-badge__dot" aria-hidden="true" />
                              {assignment.isActive ? 'Active' : 'Completed'}
                            </span>
                          </td>
                          <td>{assignment.notes || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* End Assignment Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(assignmentToEnd)}
        title="End Vehicle Assignment"
        itemName={
          assignmentToEnd
            ? `Driver: ${assignmentToEnd.driverLicenseNumber} ↔ Vehicle: ${assignmentToEnd.vehicleRegistrationNumber}`
            : undefined
        }
        message="Are you sure you want to end this assignment? Both driver and vehicle statuses will return to Available."
        isDeleting={isEnding}
        onConfirm={handleConfirmEndAssignment}
        onCancel={() => setAssignmentToEnd(null)}
      />
    </div>
  );
};

export default AssignmentPanel;
