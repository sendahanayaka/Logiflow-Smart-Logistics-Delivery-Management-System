import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FleetHeader } from '../components/FleetHeader';

export const FleetLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="portal-container" aria-labelledby="fleet-hub-title">
      <FleetHeader
        title="Fleet Management Hub"
        subtitle="Manage drivers, vehicles, assignments, and multi-order AI trip dispatches."
        activeTab="hub"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.5rem',
        }}
      >
        {/* Card 1: Drivers */}
        <div
          className="details-card"
          style={{
            borderRadius: '12px',
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#f0f4ff',
                color: '#08006C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#08006C', margin: '0 0 0.4rem 0' }}>
              Drivers Management
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Maintain driver roster, verify licensing expiry, track availability, and manage duty schedules.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/fleet/drivers')}
            style={{ width: '100%', padding: '0.65rem', fontWeight: 700 }}
          >
            View Drivers Roster →
          </button>
        </div>

        {/* Card 2: Vehicles */}
        <div
          className="details-card"
          style={{
            borderRadius: '12px',
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#fff7ed',
                color: '#FF5000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#08006C', margin: '0 0 0.4rem 0' }}>
              Vehicles Management
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Oversee fleet vehicles, capacity specifications, operational status, and maintenance records.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/fleet/vehicles')}
            style={{ width: '100%', padding: '0.65rem', fontWeight: 700 }}
          >
            View Vehicles List →
          </button>
        </div>

        {/* Card 3: Assignments */}
        <div
          className="details-card"
          style={{
            borderRadius: '12px',
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#08006C', margin: '0 0 0.4rem 0' }}>
              Assignments Management
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Pair available drivers with available vehicles, manage active duties, and review assignment audit history.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/fleet/assignments')}
            style={{ width: '100%', padding: '0.65rem', fontWeight: 700 }}
          >
            Manage Assignments →
          </button>
        </div>

        {/* Card 4: Duty Schedules */}
        <div
          className="details-card"
          style={{
            borderRadius: '12px',
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#08006C', margin: '0 0 0.4rem 0' }}>
              Duty Schedules
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Schedule shift rosters, manage driver work hours, check shift overlaps, and ensure compliance.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/schedules')}
            style={{ width: '100%', padding: '0.65rem', fontWeight: 700 }}
          >
            Manage Schedules →
          </button>
        </div>

        {/* Card 5: Vehicle Maintenance */}
        <div
          className="details-card"
          style={{
            borderRadius: '12px',
            padding: '1.5rem',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#f3e8ff',
                color: '#7e22ce',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#08006C', margin: '0 0 0.4rem 0' }}>
              Maintenance Records
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Track servicing schedules, repair logs, vehicle maintenance costs, and operational status updates.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/maintenance')}
            style={{ width: '100%', padding: '0.65rem', fontWeight: 700 }}
          >
            Manage Maintenance →
          </button>
        </div>

        {/* Card 6: Multi-Order Trips */}
        <div
          className="details-card"
          style={{
            borderRadius: '12px',
            padding: '1.5rem',
            backgroundColor: '#fff7ed',
            border: '2px solid #FF5000',
            boxShadow: '0 4px 16px rgba(255, 80, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: '#ffedd5',
                color: '#FF5000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c2410c', margin: '0 0 0.4rem 0' }}>
              Multi-Order AI Trips
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#9a3412', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Consolidate multiple compatible orders into a single operational trip using the Agentic AI allocation workflow.
            </p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => navigate('/orders')}
            style={{
              width: '100%',
              padding: '0.65rem',
              fontWeight: 800,
              backgroundColor: '#FF5000',
              borderColor: '#FF5000',
            }}
          >
            Create Multi-Order Trip
          </button>
        </div>
      </div>
    </section>
  );
};

export default FleetLandingPage;
