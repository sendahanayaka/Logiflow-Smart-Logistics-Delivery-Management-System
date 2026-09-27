import React, { useState } from 'react';
import { Driver } from '../types';
import { useLazyCheckDriverAvailabilityQuery } from '../api/fleetApi';

interface DutyScheduleCheckModalProps {
  isOpen: boolean;
  drivers: Driver[];
  onClose: () => void;
}

export const DutyScheduleCheckModal: React.FC<DutyScheduleCheckModalProps> = ({
  isOpen,
  drivers,
  onClose,
}) => {
  const [triggerCheck, { isLoading, data, isError }] = useLazyCheckDriverAvailabilityQuery();

  const [driverId, setDriverId] = useState(drivers.length > 0 ? drivers[0].id : '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!driverId) {
      setValidationError('Please select a driver.');
      return;
    }

    if (!startTime || !endTime) {
      setValidationError('Please select both Start Time and End Time.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      setValidationError('Start Time must be strictly before End Time.');
      return;
    }

    triggerCheck({
      driverId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Check Driver Availability</h2>
            <p className="modal-subtitle">
              Verify if a driver is legally available &amp; unassigned for a proposed duty period
            </p>
          </div>
        </div>

        {validationError && (
          <div className="error-message" style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
            {validationError}
          </div>
        )}

        <form onSubmit={handleCheck} className="user-form">
          <div className="form-field">
            <label htmlFor="checkDriver">Select Driver *</label>
            <select
              id="checkDriver"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              required
            >
              <option value="" disabled>Select Driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.licenseNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="user-form__grid">
            <div className="form-field">
              <label htmlFor="checkStart">Requested Start Time *</label>
              <input
                id="checkStart"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="checkEnd">Requested End Time *</label>
              <input
                id="checkEnd"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Check Availability'}
            </button>
          </div>
        </form>

        {/* Availability Result Display */}
        {data && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              borderRadius: '8px',
              border: `2px solid ${data.available ? '#22c55e' : '#ef4444'}`,
              backgroundColor: data.available ? '#f0fdf4' : '#fef2f2',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.98rem', color: data.available ? '#15803d' : '#991b1b' }}>
              {data.available ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  <span>DRIVER AVAILABLE</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  <span>DRIVER NOT AVAILABLE</span>
                </>
              )}
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.875rem', color: '#334155' }}>
              <strong>Driver:</strong> {data.driverName}
            </p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#475569' }}>
              <strong>Reason:</strong> {data.reason}
            </p>
            {data.conflictingScheduleId && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#991b1b', fontStyle: 'italic' }}>
                Conflicting Schedule ID: {data.conflictingScheduleId}
              </p>
            )}
          </div>
        )}

        {isError && (
          <div className="error-message" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
            Failed to evaluate driver availability.
          </div>
        )}
      </div>
    </div>
  );
};
