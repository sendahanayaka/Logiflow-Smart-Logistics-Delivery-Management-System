import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  useGetDutySchedulesQuery,
  useGetDriversQuery,
  useDeleteDutyScheduleMutation,
} from '../api/fleetApi';
import { DutyScheduleResponse, DutyScheduleStatus } from '../types';
import { DutyScheduleTable } from '../components/DutyScheduleTable';
import { DutyScheduleModal } from '../components/DutyScheduleModal';
import { DutyScheduleCheckModal } from '../components/DutyScheduleCheckModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { FleetHeader } from '../components/FleetHeader';

export const DutySchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const driverIdParam = searchParams.get('driverId') || '';

  const { data: schedules = [], isLoading, isError, error, refetch } = useGetDutySchedulesQuery();
  const { data: drivers = [] } = useGetDriversQuery();
  const [deleteSchedule, { isLoading: isDeleting }] = useDeleteDutyScheduleMutation();

  const [selectedDriverFilter, setSelectedDriverFilter] = useState(driverIdParam);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState<DutyScheduleResponse | null>(null);
  const [scheduleToDelete, setScheduleToDelete] = useState<DutyScheduleResponse | null>(null);

  useEffect(() => {
    setSelectedDriverFilter(driverIdParam);
  }, [driverIdParam]);

  const handleDriverFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedDriverFilter(val);
    if (val) {
      setSearchParams({ driverId: val });
    } else {
      setSearchParams({});
    }
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchesDriver = !selectedDriverFilter || s.driverId === selectedDriverFilter;
      const matchesStatus =
        selectedStatusFilter === 'ALL' || s.status === Number(selectedStatusFilter);
      return matchesDriver && matchesStatus;
    });
  }, [schedules, selectedDriverFilter, selectedStatusFilter]);

  const handleCreateNew = () => {
    setScheduleToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (schedule: DutyScheduleResponse) => {
    setScheduleToEdit(schedule);
    setIsModalOpen(true);
  };

  const handleDelete = (schedule: DutyScheduleResponse) => {
    setScheduleToDelete(schedule);
  };

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;
    try {
      await deleteSchedule(scheduleToDelete.id).unwrap();
      setScheduleToDelete(null);
    } catch {
      // Error handled by RTK Query
    }
  };

  // Metrics calculation
  const totalSchedules = schedules.length;
  const activeShiftsCount = useMemo(
    () => schedules.filter((s) => s.status === DutyScheduleStatus.Active).length,
    [schedules]
  );
  const scheduledShiftsCount = useMemo(
    () => schedules.filter((s) => s.status === DutyScheduleStatus.Scheduled).length,
    [schedules]
  );

  const filterDriverName = useMemo(() => {
    if (!selectedDriverFilter) return null;
    const d = drivers.find((drv) => drv.id === selectedDriverFilter);
    return d ? d.fullName : null;
  }, [drivers, selectedDriverFilter]);

  return (
    <section className="users-page" aria-labelledby="duty-schedule-title">
      <FleetHeader
        title="Duty Schedule Management"
        subtitle="Schedule driver duty shifts, manage operational rosters, and check schedule availability."
        breadcrumbs={[{ label: 'Duty Schedules' }]}
        activeTab="schedules"
        actionButton={
          <>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setIsCheckModalOpen(true)}
              style={{ borderColor: 'var(--color-orange)', color: 'var(--color-orange)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Check Availability</span>
            </button>
            <button type="button" className="button button--primary" onClick={handleCreateNew}>
              + Schedule New Shift
            </button>
          </>
        }
      />

      {/* Top Stat Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--navy">
          <div className="stat-card__header">
            <span className="stat-card__title">Total Duty Schedules</span>
            <span className="stat-card__icon" aria-hidden="true">📅</span>
          </div>
          <div className="stat-card__value">{totalSchedules}</div>
          <div className="stat-card__subtext">Operational shift records</div>
        </div>

        <div className="stat-card stat-card--orange">
          <div className="stat-card__header">
            <span className="stat-card__title">Active Shifts</span>
            <span className="stat-card__icon" aria-hidden="true">⏱️</span>
          </div>
          <div className="stat-card__value">{activeShiftsCount}</div>
          <div className="stat-card__subtext">Currently on scheduled duty</div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__header">
            <span className="stat-card__title">Scheduled Shifts</span>
            <span className="stat-card__icon" aria-hidden="true">📋</span>
          </div>
          <div className="stat-card__value">{scheduledShiftsCount}</div>
          <div className="stat-card__subtext">Upcoming rostered shifts</div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="users-toolbar">
        <div className="users-toolbar__filters">
          <select
            className="toolbar-select"
            value={selectedDriverFilter}
            onChange={handleDriverFilterChange}
          >
            <option value="">All Drivers</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} ({d.licenseNumber})
              </option>
            ))}
          </select>

          <select
            className="toolbar-select"
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
          >
            <option value="ALL">All Schedule Statuses</option>
            <option value={DutyScheduleStatus.Scheduled}>Scheduled</option>
            <option value={DutyScheduleStatus.Active}>Active Shift</option>
            <option value={DutyScheduleStatus.Completed}>Completed</option>
            <option value={DutyScheduleStatus.Cancelled}>Cancelled</option>
          </select>

          {(selectedDriverFilter || selectedStatusFilter !== 'ALL') && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setSelectedDriverFilter('');
                setSelectedStatusFilter('ALL');
                setSearchParams({});
              }}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => refetch()}
          title="Refresh Data"
        >
          🔄 Refresh
        </button>
      </div>

      {filterDriverName && (
        <div style={{ marginBottom: '1rem', padding: '0.65rem 1rem', borderRadius: '6px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.875rem' }}>
          Showing duty schedules specifically for: <strong>{filterDriverName}</strong>
        </div>
      )}

      {isLoading && (
        <div className="details-card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '3rem' }}>
          Loading duty schedules...
        </div>
      )}

      {isError && (
        <div className="error-message">
          <h3>Failed to Load Duty Schedules</h3>
          <p>
            {error && 'data' in error
              ? (error.data as { message?: string })?.message || 'An error occurred fetching duty schedules.'
              : 'Unable to connect to backend server. Please verify API status.'}
          </p>
          <button type="button" className="button button--danger" style={{ marginTop: '0.75rem' }} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {filteredSchedules.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: '0 0 0.5rem 0' }}>No Duty Schedules Found</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1.25rem 0' }}>
                {schedules.length === 0
                  ? 'No driver duty shifts have been scheduled yet. Click below to add the first shift.'
                  : 'No duty schedule records match your selected filter criteria.'}
              </p>
              {schedules.length === 0 ? (
                <button type="button" className="button button--primary" onClick={handleCreateNew}>
                  + Schedule First Shift
                </button>
              ) : (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => {
                    setSelectedDriverFilter('');
                    setSelectedStatusFilter('ALL');
                    setSearchParams({});
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <DutyScheduleTable
              schedules={filteredSchedules}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <DutyScheduleModal
        isOpen={isModalOpen}
        scheduleToEdit={scheduleToEdit}
        defaultDriverId={selectedDriverFilter}
        drivers={drivers}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Availability Check Modal */}
      <DutyScheduleCheckModal
        isOpen={isCheckModalOpen}
        drivers={drivers}
        onClose={() => setIsCheckModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(scheduleToDelete)}
        title="Delete Duty Schedule"
        itemName={scheduleToDelete ? `Shift for ${scheduleToDelete.driverName}` : undefined}
        message="Are you sure you want to delete this duty schedule record? This action cannot be undone."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setScheduleToDelete(null)}
      />
    </section>
  );
};

export default DutySchedulePage;
