import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface FleetHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  activeTab?: 'drivers' | 'vehicles' | 'assignments' | 'trips' | 'schedules' | 'maintenance' | 'hub';
  actionButton?: React.ReactNode;
}

export const FleetHeader: React.FC<FleetHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  activeTab,
  actionButton,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;
  const currentTab =
    activeTab ||
    (currentPath.includes('/drivers')
      ? 'drivers'
      : currentPath.includes('/vehicles')
      ? 'vehicles'
      : currentPath.includes('/assignments')
      ? 'assignments'
      : currentPath.includes('/orders') || currentPath.includes('/trips')
      ? 'trips'
      : currentPath.includes('/schedules')
      ? 'schedules'
      : currentPath.includes('/maintenance')
      ? 'maintenance'
      : 'hub');

  return (
    <header className="users-page__header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem', marginBottom: '1.5rem' }}>
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: '0.65rem' }}>
        <ol
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.4rem',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            fontSize: '0.82rem',
            color: '#64748b',
            whiteSpace: 'nowrap',
          }}
        >
          <li>
            <Link to="/fleet" style={{ color: '#08006C', fontWeight: 600, textDecoration: 'none' }}>
              Fleet Management
            </Link>
          </li>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span style={{ color: '#cbd5e1' }}>/</span>
              <li>
                {crumb.path ? (
                  <Link to={crumb.path} style={{ color: '#08006C', fontWeight: 500, textDecoration: 'none' }}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: '#334155', fontWeight: 600 }}>{crumb.label}</span>
                )}
              </li>
            </React.Fragment>
          ))}
        </ol>
      </nav>

      {/* Main Header Title & Primary Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="page-heading" style={{ margin: 0 }}>
          <span className="eyebrow" style={{ color: '#FF5000', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.78rem' }}>
            Logistics Fleet Operations
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#08006C', margin: '0.2rem 0' }}>
            {title}
          </h1>
          {subtitle && <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>{subtitle}</p>}
        </div>

        {actionButton && <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>{actionButton}</div>}
      </div>

      {/* Sub-Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Fleet Management Sections"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0.25rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'drivers'}
          onClick={() => navigate('/fleet/drivers')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '6px 6px 0 0',
            border: 'none',
            borderBottom: currentTab === 'drivers' ? '3px solid #08006C' : '3px solid transparent',
            backgroundColor: currentTab === 'drivers' ? '#f0f4ff' : 'transparent',
            color: currentTab === 'drivers' ? '#08006C' : '#64748b',
            fontWeight: currentTab === 'drivers' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Drivers</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'vehicles'}
          onClick={() => navigate('/fleet/vehicles')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '6px 6px 0 0',
            border: 'none',
            borderBottom: currentTab === 'vehicles' ? '3px solid #08006C' : '3px solid transparent',
            backgroundColor: currentTab === 'vehicles' ? '#f0f4ff' : 'transparent',
            color: currentTab === 'vehicles' ? '#08006C' : '#64748b',
            fontWeight: currentTab === 'vehicles' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span>Vehicles</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'assignments'}
          onClick={() => navigate('/fleet/assignments')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '6px 6px 0 0',
            border: 'none',
            borderBottom: currentTab === 'assignments' ? '3px solid #08006C' : '3px solid transparent',
            backgroundColor: currentTab === 'assignments' ? '#f0f4ff' : 'transparent',
            color: currentTab === 'assignments' ? '#08006C' : '#64748b',
            fontWeight: currentTab === 'assignments' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span>Assignments</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'schedules'}
          onClick={() => navigate('/schedules')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '6px 6px 0 0',
            border: 'none',
            borderBottom: currentTab === 'schedules' ? '3px solid #08006C' : '3px solid transparent',
            backgroundColor: currentTab === 'schedules' ? '#f0f4ff' : 'transparent',
            color: currentTab === 'schedules' ? '#08006C' : '#64748b',
            fontWeight: currentTab === 'schedules' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Duty Schedules</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'maintenance'}
          onClick={() => navigate('/maintenance')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '6px 6px 0 0',
            border: 'none',
            borderBottom: currentTab === 'maintenance' ? '3px solid #08006C' : '3px solid transparent',
            backgroundColor: currentTab === 'maintenance' ? '#f0f4ff' : 'transparent',
            color: currentTab === 'maintenance' ? '#08006C' : '#64748b',
            fontWeight: currentTab === 'maintenance' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span>Maintenance</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'trips'}
          onClick={() => navigate('/orders')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '6px 6px 0 0',
            border: 'none',
            borderBottom: currentTab === 'trips' ? '3px solid #FF5000' : '3px solid transparent',
            backgroundColor: currentTab === 'trips' ? '#fff7ed' : 'transparent',
            color: currentTab === 'trips' ? '#c2410c' : '#64748b',
            fontWeight: currentTab === 'trips' ? 800 : 600,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Multi-Order Trips</span>
        </button>
      </div>
    </header>
  );
};
