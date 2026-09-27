import React, { useState, useEffect } from 'react';
import {
  DutyScheduleResponse,
  DutyScheduleStatus,
  Driver,
} from '../types';
import {
  useCreateDutyScheduleMutation,
  useUpdateDutyScheduleMutation,
} from '../api/fleetApi';

interface DutyScheduleModalProps {
  isOpen: boolean;
  scheduleToEdit?: DutyScheduleResponse | null;
  defaultDriverId?: string;
  drivers: Driver[];
  onClose: () => void;
}

export const DutyScheduleModal: React.FC<DutyScheduleModalProps> = ({
  isOpen,
  scheduleToEdit,
  defaultDriverId,
  drivers,
  onClose,
}) => {
  const [createSchedule, { isLoading: isCreating }] = useCreateDutyScheduleMutation();
  const [updateSchedule, { isLoading: isUpdating }] = useUpdateDutyScheduleMutation();

  const [driverId, setDriverId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<DutyScheduleStatus>(DutyScheduleStatus.Scheduled);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to format ISO string to local datetime-local input string
  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  useEffect(() => {
    if (scheduleToEdit) {
      setDriverId(scheduleToEdit.driverId);
      setStartTime(formatDateTimeLocal(scheduleToEdit.startTime));
      setEndTime(formatDateTimeLocal(scheduleToEdit.endTime));
      setStatus(scheduleToEdit.status);
      setNotes(scheduleToEdit.notes || '');
    } else {
      setDriverId(defaultDriverId || (drivers.length > 0 ? drivers[0].id : ''));
      const now = new Date();
      const defaultStart = new Date(now.getTime() + 3600000); // 1 hr from now
      const defaultEnd = new Date(now.getTime() + 9 * 3600000); // 9 hrs from now
      setStartTime(formatDateTimeLocal(defaultStart.toISOString()));
      setEndTime(formatDateTimeLocal(defaultEnd.toISOString()));
      setStatus(DutyScheduleStatus.Scheduled);
      setNotes('');
    }
    setErrorMessage(null);
  }, [scheduleToEdit, defaultDriverId, drivers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!driverId) {
      setErrorMessage('Please select a driver.');
      return;
    }

    if (!startTime || !endTime) {
      setErrorMessage('Please specify both Start Time and End Time.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setErrorMessage('Start Time must be strictly before End Time.');
      return;
    }

    try {
      if (scheduleToEdit) {
        await updateSchedule({
          id: scheduleToEdit.id,
          data: {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            status,
            notes,
          },
        }).unwrap();
      } else {
        await createSchedule({
          driverId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          status,
          notes,
        }).unwrap();
      }
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'data' in err) {
        const data = (err as { data?: { message?: string } }).data;
        setErrorMessage(data?.message || 'Failed to save duty schedule.');
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {scheduleToEdit ? 'Edit Duty Schedule' : 'Schedule Driver Shift'}
            </h2>
            <p className="modal-subtitle">
              {scheduleToEdit
                ? `Updating shift for ${scheduleToEdit.driverName}`
                : 'Define driver duty hours and scheduled shift period'}
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="error-message" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-form">
          {!scheduleToEdit && (
            <div className="form-field">
              <label htmlFor="driverSelect">Driver *</label>
              <select
                id="driverSelect"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select a Driver
                </option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.licenseNumber}) - {d.status === 1 ? 'Available' : 'On Duty/Off'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="user-form__grid">
            <div className="form-field">
              <label htmlFor="startTime">Shift Start Time *</label>
              <input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="endTime">Shift End Time *</label>
              <input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="user-form__grid">
            <div className="form-field">
              <label htmlFor="status">Schedule Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(Number(e.target.value) as DutyScheduleStatus)}
              >
                <option value={DutyScheduleStatus.Scheduled}>Scheduled</option>
                <option value={DutyScheduleStatus.Active}>Active</option>
                <option value={DutyScheduleStatus.Completed}>Completed</option>
                <option value={DutyScheduleStatus.Cancelled}>Cancelled</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="notes">Notes / Shift Details</label>
              <input
                id="notes"
                type="text"
                placeholder="e.g. Morning retail delivery shift"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : scheduleToEdit
                ? 'Update Schedule'
                : 'Create Duty Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
