import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaintenanceRecordResponse, MaintenanceStatus } from '../types';
import {
  useGetMaintenanceRecordsQuery,
  useGetVehiclesQuery,
  useDeleteMaintenanceRecordMutation,
} from '../api/fleetApi';
import { MaintenanceRecordTable } from '../components/MaintenanceRecordTable';
import { MaintenanceRecordModal } from '../components/MaintenanceRecordModal';
import { MaintenanceStatusModal } from '../components/MaintenanceStatusModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { FleetHeader } from '../components/FleetHeader';

export const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();

  const { data: records = [], isLoading, isError, refetch } = useGetMaintenanceRecordsQuery();
  const { data: vehicles = [] } = useGetVehiclesQuery();
  const [deleteRecord] = useDeleteMaintenanceRecordMutation();

  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<MaintenanceRecordResponse | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [vehicleForStatus, setVehicleForStatus] = useState<string>('');

  const [recordToDelete, setRecordToDelete] = useState<MaintenanceRecordResponse | null>(null);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesVehicle = !selectedVehicleFilter || r.vehicleId === selectedVehicleFilter;
      const matchesStatus = selectedStatusFilter === '' || r.status === Number(selectedStatusFilter);
      return matchesVehicle && matchesStatus;
    });
  }, [records, selectedVehicleFilter, selectedStatusFilter]);

  // Statistics
  const totalCost = useMemo(() => records.reduce((acc, r) => acc + r.cost, 0), [records]);
  const inProgressCount = useMemo(() => records.filter((r) => r.status === MaintenanceStatus.InProgress).length, [records]);
  const scheduledCount = useMemo(() => records.filter((r) => r.status === MaintenanceStatus.Scheduled).length, [records]);

  const handleOpenCreateModal = () => {
    setRecordToEdit(null);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditModal = (record: MaintenanceRecordResponse) => {
    setRecordToEdit(record);
    setIsRecordModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      await deleteRecord(recordToDelete.id).unwrap();
      setRecordToDelete(null);
    } catch {
      // Handled in RTK Query / error state
    }
  };

  const selectedVehicleObj = useMemo(() => {
    if (!vehicleForStatus) return null;
    return vehicles.find((v) => v.id === vehicleForStatus) || null;
  }, [vehicles, vehicleForStatus]);

  return (
    <section className="portal-container" aria-labelledby="maintenance-page-title">
      <FleetHeader
        title="Vehicle Maintenance Records"
        subtitle="Record, manage, and track servicing, repairs, and operational maintenance for fleet vehicles."
        breadcrumbs={[{ label: 'Maintenance' }]}
        activeTab="maintenance"
        actionButton={
          <button
            type="button"
            className="button button--primary"
            onClick={handleOpenCreateModal}
          >
            + New Maintenance Record
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-card--navy">
          <div className="stat-card__header">
            <span className="stat-card__title">Total Maintenance Records</span>
            <span className="stat-card__icon" aria-hidden="true">📋</span>
          </div>
          <div className="stat-card__value">{records.length}</div>
        </div>

        <div className="stat-card stat-card--amber">
          <div className="stat-card__header">
            <span className="stat-card__title">In Progress Maintenance</span>
            <span className="stat-card__icon" aria-hidden="true">🛠️</span>
          </div>
          <div className="stat-card__value">{inProgressCount}</div>
        </div>

        <div className="stat-card stat-card--navy">
          <div className="stat-card__header">
            <span className="stat-card__title">Scheduled Maintenance</span>
            <span className="stat-card__icon" aria-hidden="true">📅</span>
          </div>
          <div className="stat-card__value">{scheduledCount}</div>
        </div>

        <div className="stat-card stat-card--orange">
          <div className="stat-card__header">
            <span className="stat-card__title">Total Maintenance Cost</span>
            <span className="stat-card__icon" aria-hidden="true">💲</span>
          </div>
          <div className="stat-card__value">
            ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="panel" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={selectedVehicleFilter}
              onChange={(e) => setSelectedVehicleFilter(e.target.value)}
              style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            >
              <option value="">All Fleet Vehicles ({vehicles.length})</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} ({v.make} {v.model})
                </option>
              ))}
            </select>

            <select
              className="form-control"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            >
              <option value="">All Statuses</option>
              <option value={MaintenanceStatus.Scheduled}>Scheduled</option>
              <option value={MaintenanceStatus.InProgress}>In Progress</option>
              <option value={MaintenanceStatus.Completed}>Completed</option>
              <option value={MaintenanceStatus.Cancelled}>Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {selectedVehicleFilter && (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => {
                  setVehicleForStatus(selectedVehicleFilter);
                  setIsStatusModalOpen(true);
                }}
                style={{ borderColor: '#f97316', color: '#f97316', fontWeight: 600 }}
              >
                ⚡ Check Maintenance Status
              </button>
            )}
            <button
              type="button"
              className="button button--secondary"
              onClick={() => refetch()}
            >
              Refresh
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            Loading fleet maintenance records...
          </div>
        ) : isError ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fef2f2', borderRadius: '8px', color: '#991b1b' }}>
            <h3>Failed to Load Maintenance Records</h3>
            <p>Could not communicate with the Fleet API.</p>
            <button type="button" className="button button--secondary" onClick={() => refetch()} style={{ marginTop: '0.5rem' }}>
              Retry
            </button>
          </div>
        ) : (
          <MaintenanceRecordTable
            records={filteredRecords}
            onEditRecord={handleOpenEditModal}
            onDeleteRecord={(rec) => setRecordToDelete(rec)}
          />
        )}
      </div>

      {/* Record Modal */}
      <MaintenanceRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        recordToEdit={recordToEdit}
        defaultVehicleId={selectedVehicleFilter}
        vehicles={vehicles}
      />

      {/* Vehicle Maintenance Status Check Modal */}
      <MaintenanceStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        vehicle={selectedVehicleObj}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!recordToDelete}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Maintenance Record"
        message={`Are you sure you want to delete the maintenance record for '${recordToDelete?.maintenanceType}' on ${recordToDelete?.vehicleRegistrationNumber}? This action cannot be undone.`}
      />
    </section>
  );
};

export default MaintenancePage;
