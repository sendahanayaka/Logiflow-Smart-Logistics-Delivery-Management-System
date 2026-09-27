import React, { useState, useEffect } from 'react';
import {
  MaintenanceRecordResponse,
  MaintenanceStatus,
  Vehicle,
} from '../types';
import {
  useCreateMaintenanceRecordMutation,
  useUpdateMaintenanceRecordMutation,
} from '../api/fleetApi';

interface MaintenanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: MaintenanceRecordResponse | null;
  defaultVehicleId?: string;
  vehicles: Vehicle[];
}

export const MaintenanceRecordModal: React.FC<MaintenanceRecordModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  defaultVehicleId,
  vehicles,
}) => {
  const [vehicleId, setVehicleId] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number | ''>(0);
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [status, setStatus] = useState<MaintenanceStatus>(MaintenanceStatus.Scheduled);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createRecord, { isLoading: isCreating }] = useCreateMaintenanceRecordMutation();
  const [updateRecord, { isLoading: isUpdating }] = useUpdateMaintenanceRecordMutation();

  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (recordToEdit) {
      setVehicleId(recordToEdit.vehicleId);
      setMaintenanceDate(recordToEdit.maintenanceDate ? recordToEdit.maintenanceDate.substring(0, 16) : '');
      setMaintenanceType(recordToEdit.maintenanceType);
      setDescription(recordToEdit.description || '');
      setCost(recordToEdit.cost);
      setNextMaintenanceDate(recordToEdit.nextMaintenanceDate ? recordToEdit.nextMaintenanceDate.substring(0, 10) : '');
      setStatus(recordToEdit.status);
    } else {
      setVehicleId(defaultVehicleId || (vehicles.length > 0 ? vehicles[0].id : ''));
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setMaintenanceDate(now.toISOString().substring(0, 16));
      setMaintenanceType('Routine Inspection');
      setDescription('');
      setCost(100);
      setNextMaintenanceDate('');
      setStatus(MaintenanceStatus.Scheduled);
    }
    setErrorMsg(null);
  }, [recordToEdit, defaultVehicleId, vehicles, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!vehicleId) {
      setErrorMsg('Please select a vehicle.');
      return;
    }

    if (!maintenanceDate) {
      setErrorMsg('Maintenance date is required.');
      return;
    }

    if (!maintenanceType.trim()) {
      setErrorMsg('Maintenance type is required.');
      return;
    }

    if (cost === '' || Number(cost) < 0) {
      setErrorMsg('Cost must not be negative.');
      return;
    }

    if (nextMaintenanceDate && new Date(nextMaintenanceDate) < new Date(maintenanceDate)) {
      setErrorMsg('Next maintenance date cannot be earlier than maintenance date.');
      return;
    }

    try {
      if (recordToEdit) {
        await updateRecord({
          id: recordToEdit.id,
          data: {
            maintenanceDate: new Date(maintenanceDate).toISOString(),
            maintenanceType: maintenanceType.trim(),
            description: description.trim() || null,
            cost: Number(cost),
            nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate).toISOString() : null,
            status,
          },
        }).unwrap();
      } else {
        await createRecord({
          vehicleId,
          maintenanceDate: new Date(maintenanceDate).toISOString(),
          maintenanceType: maintenanceType.trim(),
          description: description.trim() || null,
          cost: Number(cost),
          nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate).toISOString() : null,
          status,
        }).unwrap();
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to save maintenance record. Please check inputs.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(249, 115, 22, 0.12)',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              🛠️
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                {recordToEdit ? 'Edit Maintenance Record' : 'Record Fleet Maintenance'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                {recordToEdit ? 'Update maintenance details and vehicle status' : 'Enter maintenance work performed or scheduled'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fca5a5',
                color: '#991b1b',
                fontSize: '0.88rem',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Vehicle *
              </label>
              <select
                className="form-control"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                disabled={!!recordToEdit || !!defaultVehicleId}
                required
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select a vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} ({v.make} {v.model} - {v.vehicleType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Maintenance Date *
              </label>
              <input
                type="datetime-local"
                className="form-control"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Maintenance Type *
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Engine Oil Change, Brake Service"
                value={maintenanceType}
                onChange={(e) => setMaintenanceType(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Cost ($ / LKR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                required
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Status *
              </label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(Number(e.target.value) as MaintenanceStatus)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value={MaintenanceStatus.Scheduled}>Scheduled</option>
                <option value={MaintenanceStatus.InProgress}>In Progress</option>
                <option value={MaintenanceStatus.Completed}>Completed</option>
                <option value={MaintenanceStatus.Cancelled}>Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Next Maintenance Date
              </label>
              <input
                type="date"
                className="form-control"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Description & Notes
              </label>
              <textarea
                rows={3}
                className="form-control"
                placeholder="Details of repair, parts replaced, technician notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <footer
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting}
              style={{ minWidth: '120px' }}
            >
              {isSubmitting ? 'Saving...' : recordToEdit ? 'Update Record' : 'Save Record'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};
